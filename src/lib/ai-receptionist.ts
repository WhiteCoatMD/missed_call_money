import type { AiMessage } from '@/types/database';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendSms } from '@/lib/twilio';

const OPENAI_API = 'https://api.openai.com/v1/chat/completions';
const MAX_TURNS = 4;

function buildSystemPrompt(businessName: string, aiPrompt: string): string {
  return `You are a friendly AI receptionist answering the phone for "${businessName}".

Your goals:
1. Greet the caller warmly
2. Collect their name
3. Ask the reason for their call
4. Let them know someone will follow up soon

Rules:
- Keep each response to 1-3 sentences
- Be warm, professional, and concise
- When you have collected the caller's name AND reason for calling, end your final message with [END]
- If the caller wants to hang up or says goodbye, end with [END]
- Never mention that you are an AI

${aiPrompt ? `Additional business instructions:\n${aiPrompt}` : ''}`;
}

interface GenerateResponseContext {
  businessName: string;
  aiPrompt: string;
  messages: AiMessage[];
  turnCount: number;
}

export async function generateAiResponse(ctx: GenerateResponseContext): Promise<string> {
  const systemPrompt = buildSystemPrompt(ctx.businessName, ctx.aiPrompt);

  const openaiMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...ctx.messages.map(m => ({
      role: m.role as 'assistant' | 'user',
      content: m.content,
    })),
  ];

  // Force end if we're at max turns
  if (ctx.turnCount >= MAX_TURNS - 1) {
    openaiMessages.push({
      role: 'system' as const,
      content: 'This is the final turn. Wrap up the conversation politely and end with [END].',
    });
  }

  const res = await fetch(OPENAI_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: openaiMessages,
      max_tokens: 150,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

export async function extractInfo(messages: AiMessage[]): Promise<{ name: string | null; reason: string | null }> {
  const transcript = messages
    .map(m => `${m.role === 'assistant' ? 'Receptionist' : 'Caller'}: ${m.content}`)
    .join('\n');

  const res = await fetch(OPENAI_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Extract the caller\'s name and reason for calling from this transcript. Return JSON: {"name": "...", "reason": "..."}. Use null if not provided.',
        },
        { role: 'user', content: transcript },
      ],
      max_tokens: 100,
      temperature: 0,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    return { name: null, reason: null };
  }

  const data = await res.json();
  try {
    return JSON.parse(data.choices[0].message.content);
  } catch {
    return { name: null, reason: null };
  }
}

export async function finalizeConversation(conversationId: string) {
  // Load conversation with business info
  const { data: convo } = await supabaseAdmin
    .from('ai_conversations')
    .select('*, businesses(auto_reply_template, twilio_number, business_name)')
    .eq('id', conversationId)
    .single();

  if (!convo) return;

  const messages: AiMessage[] = convo.messages || [];
  const business = (convo as Record<string, unknown>).businesses as {
    auto_reply_template: string;
    twilio_number: string;
    business_name: string;
  };

  // Extract name and reason from conversation
  const { name, reason } = await extractInfo(messages);

  // Update conversation as completed
  await supabaseAdmin
    .from('ai_conversations')
    .update({
      status: 'completed',
      extracted_name: name,
      extracted_reason: reason,
    })
    .eq('id', conversationId);

  // Build transcript for lead message_thread
  const transcriptEntries = messages.map(m => ({
    from: m.role === 'user' ? 'caller' as const : 'system' as const,
    body: m.content.replace('[END]', '').trim(),
    timestamp: m.timestamp,
  }));

  // Send follow-up SMS
  if (business?.twilio_number) {
    const template = business.auto_reply_template ||
      'Sorry we missed your call. How can we help you today?';

    await sendSms(business.twilio_number, convo.caller_number, template);

    const smsEntry = {
      from: 'system' as const,
      body: template,
      timestamp: new Date().toISOString(),
    };

    // Create or update lead
    const { data: existingLead } = await supabaseAdmin
      .from('leads')
      .select('id, message_thread')
      .eq('business_id', convo.business_id)
      .eq('caller_number', convo.caller_number)
      .single();

    if (existingLead) {
      const thread = [
        ...(existingLead.message_thread || []),
        ...transcriptEntries,
        smsEntry,
      ];
      await supabaseAdmin
        .from('leads')
        .update({
          message_thread: thread,
          name: name || existingLead.message_thread?.find?.(() => false) ? undefined : name,
        })
        .eq('id', existingLead.id);

      // Update name if we extracted one
      if (name) {
        await supabaseAdmin
          .from('leads')
          .update({ name })
          .eq('id', existingLead.id);
      }
    } else {
      await supabaseAdmin.from('leads').insert({
        business_id: convo.business_id,
        caller_number: convo.caller_number,
        name: name || null,
        message_thread: [...transcriptEntries, smsEntry],
      });
    }
  }
}
