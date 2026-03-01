# Missed Call Money

Revenue recovery SaaS — automatically text callers when you miss their call, capture leads, and track recovered revenue.

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Supabase** (Auth + Postgres)
- **Stripe** (Subscriptions, $79/mo)
- **Twilio** (Voice + SMS)
- **Tailwind CSS**
- **Vercel** (deploy target)

## Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx         # Email/password login
│   │   └── signup/page.tsx        # Signup with referral support
│   ├── (dashboard)/
│   │   ├── layout.tsx             # Sidebar + main layout
│   │   ├── dashboard/page.tsx     # KPI cards, missed calls table, money lost calc
│   │   ├── leads/page.tsx         # Lead list, mark as converted
│   │   ├── businesses/page.tsx    # Multi-business CRUD, white-label, badge
│   │   └── settings/page.tsx      # Subscription, referrals, account
│   ├── admin/
│   │   └── businesses/page.tsx    # Admin view of all businesses
│   ├── embed/
│   │   └── [businessId]/page.tsx  # Public revenue badge (iframe embed)
│   ├── api/
│   │   ├── twilio/voice/route.ts  # Twilio voice webhook (missed call detection)
│   │   ├── twilio/sms/route.ts    # Twilio SMS webhook (reply capture)
│   │   ├── stripe/checkout/route.ts
│   │   ├── stripe/webhook/route.ts
│   │   ├── businesses/route.ts    # Business CRUD
│   │   ├── businesses/[businessId]/badge/route.ts  # Badge JSON API
│   │   ├── leads/route.ts         # Lead management
│   │   ├── calls/route.ts         # Call history
│   │   └── referrals/route.ts     # Referral tracking
│   ├── layout.tsx
│   └── page.tsx                   # Landing page
├── components/
│   ├── sidebar.tsx
│   └── kpi-card.tsx
├── lib/
│   ├── supabase-server.ts         # Server-side Supabase client
│   ├── supabase-browser.ts        # Client-side Supabase client
│   ├── supabase-admin.ts          # Service role client (API routes)
│   ├── stripe.ts
│   └── twilio.ts                  # SMS sending + number provisioning
├── types/
│   └── database.ts                # TypeScript interfaces
├── middleware.ts                   # Auth protection + subscription gating
supabase/
└── migrations/
    └── 001_initial_schema.sql     # Full DB schema with RLS
```

## Setup Instructions

### 1. Clone and install

```bash
git clone <repo-url>
cd missed-call-money
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server only)
- `STRIPE_SECRET_KEY` — Stripe secret key
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Stripe publishable key
- `STRIPE_PRICE_ID` — Stripe Price ID for the $79/mo plan
- `TWILIO_ACCOUNT_SID` — Twilio Account SID
- `TWILIO_AUTH_TOKEN` — Twilio Auth Token
- `NEXT_PUBLIC_APP_URL` — Your app URL (e.g., https://app.missedcallmoney.com)

### 3. Database setup

Run the SQL migration in your Supabase SQL Editor:

```
supabase/migrations/001_initial_schema.sql
```

This creates all tables (users, businesses, calls, leads, subscriptions, referrals), RLS policies, indexes, triggers, and helper functions.

### 4. Stripe setup

1. Create a product in Stripe with a $79/month recurring price
2. Copy the Price ID to `STRIPE_PRICE_ID`
3. Set up a webhook endpoint pointing to `/api/stripe/webhook`
4. Listen for: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

### 5. Twilio setup

1. Get your Account SID and Auth Token from the Twilio console
2. Phone numbers are auto-provisioned when a user subscribes
3. Webhook URLs are automatically configured on purchased numbers:
   - Voice: `{APP_URL}/api/twilio/voice`
   - SMS: `{APP_URL}/api/twilio/sms`

### 6. Run locally

```bash
npm run dev
```

### 7. Deploy to Vercel

```bash
vercel --prod
```

Set all environment variables in the Vercel dashboard.

## Features

### Core
- **Missed call detection** — Rings business phone for 20s, marks as missed if unanswered
- **Auto-text on missed call** — Customizable SMS template sent to caller
- **Lead capture** — Caller replies tracked in message thread
- **Revenue tracking** — Mark leads as converted, enter revenue value
- **Money Lost Calculator** — missed_calls × avg_job_value × close_rate

### Multi-Business
- Users can manage multiple businesses under one account
- Each business gets its own Twilio number, settings, and stats

### Referral System
- Each user gets a unique referral code
- Signup link: `/signup?ref=CODE`
- Track referral status (pending → converted → paid)

### Agency White-Label
- Toggle per business to replace "Missed Call Money" branding
- Set custom agency name displayed on badge embeds

### Public Revenue Badge
- Enable per business in settings
- Embeddable iframe: `<iframe src="/embed/BUSINESS_ID" />`
- JSON API: `/api/businesses/BUSINESS_ID/badge`
- Shows "Revenue Recovered This Month" with optional white-label branding

### Admin
- `/admin/businesses` — View all businesses, subscription status, missed calls, revenue recovered
