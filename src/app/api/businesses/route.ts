import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isSuperAdmin } from '@/lib/admin';
import { purchasePhoneNumber, releasePhoneNumber } from '@/lib/twilio';

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
    ai_prompt: body.ai_prompt || '',
    average_job_value: 0,
    close_rate: 0.3,
  }).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Auto-provision Twilio number if user has active subscription or is super admin
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .single();

  const admin = isSuperAdmin(user.email || '');

  if ((subscription?.status === 'active' || admin) && data) {
    try {
      const twilioNumber = await purchasePhoneNumber(body.phone_number);
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

// DELETE /api/businesses — Delete a business
export async function DELETE(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  // Get the business first to find its Twilio number
  const { data: business } = await supabase
    .from('businesses')
    .select('twilio_number')
    .eq('id', body.id)
    .eq('user_id', user.id)
    .single();

  // Release the Twilio number to stop billing
  if (business?.twilio_number) {
    try {
      await releasePhoneNumber(business.twilio_number);
    } catch (err) {
      console.error('Failed to release Twilio number:', err);
    }
  }

  const { error } = await supabase
    .from('businesses')
    .delete()
    .eq('id', body.id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
