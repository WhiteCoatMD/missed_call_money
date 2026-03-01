import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      // @ts-expect-error — Stripe SDK may have a newer apiVersion type
      apiVersion: '2024-04-10',
      typescript: true,
    });
  }
  return _stripe;
}

// Backward-compatible export
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const PLAN_PRICE_ID = process.env.STRIPE_PRICE_ID || '';
export const PLAN_AMOUNT = 1900; // $19/month in cents
