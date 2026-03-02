import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    _stripe = new Stripe(key, {
      apiVersion: '2024-04-10' as Stripe.LatestApiVersion,
    });
  }
  return _stripe;
}

export const stripe = { get instance() { return getStripe(); } };

export const PLAN_PRICE_ID = process.env.STRIPE_PRICE_ID || '';
export const PLAN_AMOUNT = 1900; // $19/month in cents
