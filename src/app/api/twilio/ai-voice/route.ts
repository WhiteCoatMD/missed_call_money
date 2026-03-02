import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generateAiResponse, finalizeConversation } from '@/lib/ai-receptionist';
import twilio from 'twilio';
import type { AiMessage } from '@/types/database';

const VoiceResponse = twilio.twiml.VoiceResponse;
const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL || 'https://missed-call-money.vercel.app';

// POST /api/twilio/ai-voice?cid=<conversation_id>
// Handles each conversation turn after caller speaks
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cid = searchParams.get('cid');

  if (!cid) {
    const twiml = new VoiceResponse();
    twiml.say('Something went wrong. Goodbye.');
    twiml.hangup();
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  const formData = await request.formData();
  const speechResult = formData.get('SpeechResult') as string || '';

  // Load conversation + business info
  const { data: convo } = await supabaseAdmin
    .from('ai_conversations')
    .select('*, businesses(business_name, ai_prompt)')
    .eq('id', cid)
    .single();

  if (!convo || convo.status !== 'active') {
    const twiml = new VoiceResponse();
    twiml.say('Thank you for calling. Goodbye.');
    twiml.hangup();
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  const business = (convo as Record<string, unknown>).businesses as {
    business_name: string;
    ai_prompt: string;
  };
  const messages: AiMessage[] = convo.messages || [];

  // Add caller's speech to messages
  if (speechResult) {
    messages.push({
      role: 'user',
      content: speechResult,
      timestamp: new Date().toISOString(),
    });
  }

  const turnCount = convo.turn_count + 1;

  // Generate AI response
  let aiText: string;
  try {
    aiText = await generateAiResponse({
      businessName: business.business_name,
      aiPrompt: business.ai_prompt,
      messages,
      turnCount,
    });
  } catch (err) {
    console.error('AI response generation failed:', err);
    const twiml = new VoiceResponse();
    twiml.say('I apologize, we are experiencing technical difficulties. Someone will call you back shortly. Goodbye.');
    twiml.hangup();
    // Finalize what we have
    await supabaseAdmin
      .from('ai_conversations')
      .update({ messages, status: 'error', turn_count: turnCount })
      .eq('id', cid);
    await finalizeConversation(cid);
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  const isEnd = aiText.includes('[END]') || turnCount >= 4;

  // Add assistant response to messages
  const assistantTurnIndex = messages.filter(m => m.role === 'assistant').length;
  messages.push({
    role: 'assistant',
    content: aiText,
    timestamp: new Date().toISOString(),
  });

  // Save updated conversation
  await supabaseAdmin
    .from('ai_conversations')
    .update({
      messages,
      turn_count: turnCount,
      status: isEnd ? 'completed' : 'active',
    })
    .eq('id', cid);

  const twiml = new VoiceResponse();
  const ttsUrl = `${APP_URL()}/api/twilio/tts?cid=${cid}&turn=${assistantTurnIndex}`;

  if (isEnd) {
    // Play final message and hang up
    twiml.play(ttsUrl);
    twiml.hangup();
    // Finalize in the background (extract info, create lead, send SMS)
    finalizeConversation(cid).catch(err =>
      console.error('Failed to finalize conversation:', err)
    );
  } else {
    // Play response and gather next speech input
    const gather = twiml.gather({
      input: ['speech'],
      action: `${APP_URL()}/api/twilio/ai-voice?cid=${cid}`,
      method: 'POST',
      speechTimeout: 'auto',
      language: 'en-US',
    });
    gather.play(ttsUrl);

    // If no speech detected, end the conversation
    twiml.say('It seems like you may have disconnected. Someone will follow up with you. Goodbye.');
    twiml.hangup();
  }

  return new NextResponse(twiml.toString(), {
    headers: { 'Content-Type': 'text/xml' },
  });
}
