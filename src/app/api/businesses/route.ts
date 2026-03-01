import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { purchasePhoneNumber } from '@/lib/twilio';

// GET /api/businesses — List user's businesses
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/businesses — Create a business
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  const { data, error } = await supabase.from('businesses').insert({
    user_id: user.id,
    business_name: body.business_name,
    phone_number: body.phone_number,
    auto_reply_template: body.auto_reply_template || 'Sorry we missed your call. How can we help you today?',
    average_job_value: 0,
    close_rate: 0.3,
  }).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Auto-provision Twilio number if user has active subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .single();

  if (subscription?.status === 'active' && data) {
    try {
      const twilioNumber = await purchasePhoneNumber();
      await supabase
        .from('businesses')
        .update({ twilio_number: twilioNumber })
        .eq('id', data.id);
      data.twilio_number = twilioNumber;
    } catch (err) {
      console.error('Failed to provision Twilio number:', err);
    }
  }

  return NextResponse.json(data);
}

// PUT /api/businesses — Update a business
export async function PUT(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { id, ...updates } = body;

  const { data, error } = await supabase
    .from('businesses')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
