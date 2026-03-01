import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { purchasePhoneNumber } from '@/lib/twilio';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';

// POST /api/stripe/webhook — Handle Stripe webhook events
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (!userId) break;

        // Upsert subscription record
        const { data: existingSub } = await supabaseAdmin
          .from('subscriptions')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (existingSub) {
          await supabaseAdmin.from('subscriptions').update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            status: 'active',
            updated_at: new Date().toISOString(),
          }).eq('user_id', userId);
        } else {
          await supabaseAdmin.from('subscriptions').insert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            status: 'active',
          });
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Get user_id from Stripe customer metadata via REST API
        const customerRes = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
          headers: { 'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}` },
        });
        const customer = await customerRes.json();
        const userId = customer.metadata?.user_id;

        if (!userId) break;

        const status = subscription.status === 'active' ? 'active' : 'inactive';

        const { data: existingSub } = await supabaseAdmin
          .from('subscriptions')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (existingSub) {
          await supabaseAdmin.from('subscriptions').update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            status,
            updated_at: new Date().toISOString(),
          }).eq('user_id', userId);
        } else {
          await supabaseAdmin.from('subscriptions').insert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            status,
          });
        }

        // Auto-provision Twilio number for first business if subscription is active
        if (status === 'active') {
          const { data: businesses } = await supabaseAdmin
            .from('businesses')
            .select('id, twilio_number')
            .eq('user_id', userId)
            .is('twilio_number', null)
            .limit(1);

          if (businesses && businesses.length > 0) {
            try {
              const phoneNumber = await purchasePhoneNumber();
              await supabaseAdmin
                .from('businesses')
                .update({ twilio_number: phoneNumber })
                .eq('id', businesses[0].id);
            } catch (err) {
              console.error('Failed to provision Twilio number:', err);
            }
          }
        }

        // Convert referral status if applicable
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('referred_by')
          .eq('id', userId)
          .single();

        if (user?.referred_by && status === 'active') {
          await supabaseAdmin
            .from('referrals')
            .update({ status: 'converted' })
            .eq('referred_id', userId)
            .eq('status', 'pending');
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'canceled', updated_at: new Date().toISOString() })
          .eq('stripe_customer_id', customerId);

        break;
      }
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
