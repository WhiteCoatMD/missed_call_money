import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import twilio from 'twilio';

const MessagingResponse = twilio.twiml.MessagingResponse;

// POST /api/twilio/sms — Twilio SMS webhook
// Captures incoming SMS replies from callers
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const callerNumber = formData.get('From') as string;
  const twilioNumber = formData.get('To') as string;
  const messageBody = formData.get('Body') as string;

  // Find the business for this Twilio number
  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('id')
    .eq('twilio_number', twilioNumber)
    .single();

  if (!business) {
    const twiml = new MessagingResponse();
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  // Find or create lead
  const { data: existingLead } = await supabaseAdmin
    .from('leads')
    .select('id, message_thread')
    .eq('business_id', business.id)
    .eq('caller_number', callerNumber)
    .single();

  const inboundMessage = {
    from: 'caller',
    body: messageBody,
    timestamp: new Date().toISOString(),
  };

  if (existingLead) {
    const thread = [...(existingLead.message_thread || []), inboundMessage];
    await supabaseAdmin
      .from('leads')
      .update({ message_thread: thread })
      .eq('id', existingLead.id);
  } else {
    await supabaseAdmin.from('leads').insert({
      business_id: business.id,
      caller_number: callerNumber,
      message_thread: [inboundMessage],
    });
  }

  // Acknowledge receipt (empty response — no auto-reply on SMS)
  const twiml = new MessagingResponse();
  return new NextResponse(twiml.toString(), {
    headers: { 'Content-Type': 'text/xml' },
  });
}
