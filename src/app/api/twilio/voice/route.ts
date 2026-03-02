import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendSms } from '@/lib/twilio';
import twilio from 'twilio';

const VoiceResponse = twilio.twiml.VoiceResponse;

// POST /api/twilio/voice — Twilio voice webhook
// Called when an inbound call hits a Twilio number
export async function POST(request: NextRequest) {
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
  // If no answer, the <Action> URL will be hit (we use callStatus callback)
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

// GET handler for the dial action callback (missed call detection)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get('business_id');
  const callerNumber = decodeURIComponent(searchParams.get('caller') || '');
  const callSid = searchParams.get('sid');

  // This is called after the dial attempt completes
  // Check DialCallStatus to see if it was answered
  // Twilio passes this as a query param on the action URL

  return handleCallResult(request, businessId!, callerNumber, callSid!);
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

  // If missed, send auto-reply SMS and create lead
  if (isMissed) {
    const { data: business } = await supabaseAdmin
      .from('businesses')
      .select('auto_reply_template, twilio_number')
      .eq('id', businessId)
      .single();

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
