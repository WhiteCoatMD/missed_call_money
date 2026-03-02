import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendSms } from '@/lib/twilio';
import { generateAiResponse } from '@/lib/ai-receptionist';
import twilio from 'twilio';
import type { AiMessage } from '@/types/database';

const VoiceResponse = twilio.twiml.VoiceResponse;
const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL || 'https://missed-call-money.vercel.app';

// POST /api/twilio/voice — Twilio voice webhook
// Handles both initial inbound calls AND dial action callbacks
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  // If this is the dial action callback (missed call detection)
  if (action === 'status') {
    const businessId = searchParams.get('business_id')!;
    const callerNumber = decodeURIComponent(searchParams.get('caller') || '');
    const callSid = searchParams.get('sid')!;
    return handleCallResult(request, businessId, callerNumber, callSid);
  }

  // Otherwise, this is an initial inbound call
  const formData = await request.formData();
  const callerNumber = formData.get('From') as string;
  const twilioNumber = formData.get('To') as string;
  const callSid = formData.get('CallSid') as string;

  // Find the business associated with this Twilio number
  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('*')
    .eq('twilio_number', twilioNumber)
    .single();

  if (!business) {
    const twiml = new VoiceResponse();
    twiml.say('This number is not configured. Goodbye.');
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  // Ring the business owner's real phone for 20 seconds
  // If no answer, the <Action> URL will be hit via POST
  const twiml = new VoiceResponse();
  const dial = twiml.dial({
    action: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/voice?action=status&business_id=${business.id}&caller=${encodeURIComponent(callerNumber)}&sid=${callSid}`,
    timeout: 20,
  });
  dial.number(business.phone_number || '');

  return new NextResponse(twiml.toString(), {
    headers: { 'Content-Type': 'text/xml' },
  });
}

async function handleCallResult(
  request: NextRequest,
  businessId: string,
  callerNumber: string,
  callSid: string
) {
  const formData = await request.formData().catch(() => null);
  const dialStatus = formData?.get('DialCallStatus') as string || 'no-answer';

  const isMissed = dialStatus !== 'completed';
  const status = isMissed ? 'missed' : 'answered';

  // Log call in DB
  await supabaseAdmin.from('calls').insert({
    business_id: businessId,
    caller_number: callerNumber,
    call_status: status,
    call_sid: callSid,
  });

  // If missed, either start AI conversation or send static SMS
  if (isMissed) {
    const { data: business } = await supabaseAdmin
      .from('businesses')
      .select('auto_reply_template, twilio_number, ai_prompt, business_name')
      .eq('id', businessId)
      .single();

    // AI Receptionist path: if ai_prompt is configured
    if (business?.ai_prompt && business.twilio_number) {
      try {
        // Generate initial greeting
        const greeting = await generateAiResponse({
          businessName: business.business_name,
          aiPrompt: business.ai_prompt,
          messages: [],
          turnCount: 0,
        });

        const firstMessage: AiMessage = {
          role: 'assistant',
          content: greeting,
          timestamp: new Date().toISOString(),
        };

        // Create conversation row
        const { data: convo } = await supabaseAdmin
          .from('ai_conversations')
          .insert({
            business_id: businessId,
            caller_number: callerNumber,
            call_sid: callSid,
            messages: [firstMessage],
            turn_count: 0,
            status: 'active',
          })
          .select('id')
          .single();

        if (convo) {
          const twiml = new VoiceResponse();
          const ttsUrl = `${APP_URL()}/api/twilio/tts?cid=${convo.id}&turn=0`;

          const gather = twiml.gather({
            input: ['speech'],
            action: `${APP_URL()}/api/twilio/ai-voice?cid=${convo.id}`,
            method: 'POST',
            speechTimeout: 'auto',
            language: 'en-US',
          });
          gather.play(ttsUrl);

          // Fallback if no speech detected
          twiml.say('It seems like you may have disconnected. Someone will follow up with you. Goodbye.');
          twiml.hangup();

          return new NextResponse(twiml.toString(), {
            headers: { 'Content-Type': 'text/xml' },
          });
        }
      } catch (err) {
        console.error('AI receptionist failed, falling back to static message:', err);
        // Fall through to static path
      }
    }

    // Static path (original behavior)
    if (business?.twilio_number) {
      const template = business.auto_reply_template ||
        'Sorry we missed your call. How can we help you today?';

      await sendSms(business.twilio_number, callerNumber, template);

      // Create or update lead
      const { data: existingLead } = await supabaseAdmin
        .from('leads')
        .select('id, message_thread')
        .eq('business_id', businessId)
        .eq('caller_number', callerNumber)
        .single();

      const outboundMessage = {
        from: 'system',
        body: template,
        timestamp: new Date().toISOString(),
      };

      if (existingLead) {
        const thread = [...(existingLead.message_thread || []), outboundMessage];
        await supabaseAdmin
          .from('leads')
          .update({ message_thread: thread })
          .eq('id', existingLead.id);
      } else {
        await supabaseAdmin.from('leads').insert({
          business_id: businessId,
          caller_number: callerNumber,
          message_thread: [outboundMessage],
        });
      }
    }
  }

  const twiml = new VoiceResponse();
  if (isMissed) {
    twiml.say('We are sorry we missed your call. We will text you shortly.');
  }
  twiml.hangup();

  return new NextResponse(twiml.toString(), {
    headers: { 'Content-Type': 'text/xml' },
  });
}
