import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generateSpeech } from '@/lib/elevenlabs';

// GET /api/twilio/tts?cid=<conversation_id>&turn=<turn_number>
// Twilio's <Play> fetches this URL to stream ElevenLabs TTS audio
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cid = searchParams.get('cid');
  const turn = parseInt(searchParams.get('turn') || '0', 10);

  if (!cid) {
    return new NextResponse('Missing cid', { status: 400 });
  }

  const { data: convo } = await supabaseAdmin
    .from('ai_conversations')
    .select('messages')
    .eq('id', cid)
    .single();

  if (!convo) {
    return new NextResponse('Conversation not found', { status: 404 });
  }

  // Find the assistant message at the given turn index
  const assistantMessages = (convo.messages || []).filter(
    (m: { role: string }) => m.role === 'assistant'
  );
  const message = assistantMessages[turn];

  if (!message) {
    return new NextResponse('Turn not found', { status: 404 });
  }

  // Strip [END] marker from spoken text
  const text = message.content.replace('[END]', '').trim();

  const audio = await generateSpeech(text);

  return new NextResponse(audio, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-cache',
    },
  });
}
