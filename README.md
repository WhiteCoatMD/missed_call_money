# Missed Call Money (247 Front Runner)

Turn missed business calls into leads and revenue. When a business misses a phone call, the system auto-texts the caller and (optionally) deploys an AI voice receptionist to collect their name and reason for calling.

**Live URL:** https://247frontrunner.com

## Tech Stack

- **Framework:** Next.js 14 (App Router), TypeScript
- **Database:** Supabase (Postgres + Auth + RLS)
- **Payments:** Stripe ($79/mo subscription)
- **Telephony:** Twilio (voice webhooks, SMS, number provisioning)
- **AI Voice:** OpenAI GPT-4o-mini (conversation) + ElevenLabs (TTS)
- **Styling:** Tailwind CSS (violet/indigo gradient theme, glass effects)
- **Deploy:** Vercel

## Features

1. **Auth** — Email/password signup & login via Supabase Auth
2. **Subscription gating** — Middleware checks Stripe subscription status; redirects to checkout if inactive
3. **Multi-business support** — Each user can create multiple businesses, each gets its own Twilio number
4. **Missed call detection** — Twilio voice webhook rings the business owner for 20s, then triggers missed-call flow
5. **Auto-SMS** — Sends a customizable text to the caller on missed call
6. **SMS reply capture** — Inbound SMS replies create/update leads
7. **AI Voice Receptionist** (opt-in per business) — When `ai_prompt` is set, missed calls get an AI-powered phone conversation that collects name + reason, saves transcript to the lead, then sends SMS
8. **Dashboard** — KPI cards (missed calls, leads, revenue recovered) + money lost calculator
9. **Lead management** — View leads, message threads (including AI transcripts), mark as converted with revenue value
10. **Referral system** — Unique referral codes per user
11. **Admin panel** — Super admin can view all businesses, users, and stats
12. **Public revenue badge** — Embeddable iframe showing recovered revenue
13. **Agency white-label** — Toggle per business to replace branding

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login, signup, email verification
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── verify/page.tsx
│   ├── (dashboard)/         # Authenticated pages (sidebar layout)
│   │   ├── layout.tsx       # Sidebar + subscription check
│   │   ├── dashboard/       # KPI dashboard
│   │   ├── businesses/      # Business CRUD + AI prompt config
│   │   ├── leads/           # Lead list + message threads
│   │   ├── settings/        # User settings, referral code
│   │   └── subscribe-success/
│   ├── admin/               # Super admin panel
│   │   ├── businesses/page.tsx
│   │   └── users/page.tsx
│   ├── api/
│   │   ├── businesses/      # CRUD + Twilio number provisioning
│   │   ├── calls/           # Call log queries
│   │   ├── leads/           # Lead CRUD
│   │   ├── referrals/       # Referral queries
│   │   ├── admin/           # Admin-only endpoints (users, stats, subscriptions)
│   │   ├── stripe/
│   │   │   ├── checkout/    # Create Stripe checkout session
│   │   │   └── webhook/     # Stripe subscription events
│   │   └── twilio/
│   │       ├── voice/       # Inbound call handler + missed call detection
│   │       ├── sms/         # Inbound SMS → lead creation
│   │       ├── ai-voice/    # AI conversation turn handler
│   │       └── tts/         # ElevenLabs TTS audio endpoint
│   ├── embed/[businessId]/  # Public revenue badge
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
├── components/
│   ├── sidebar.tsx
│   └── kpi-card.tsx
├── lib/
│   ├── supabase-server.ts   # Server-side Supabase client (cookie-based auth)
│   ├── supabase-browser.ts  # Browser-side Supabase client
│   ├── supabase-admin.ts    # Service role client (bypasses RLS)
│   ├── stripe.ts            # Lazy-initialized Stripe client
│   ├── twilio.ts            # SMS sending + number purchase/release
│   ├── elevenlabs.ts        # ElevenLabs TTS API client
│   ├── ai-receptionist.ts   # OpenAI conversation logic + info extraction
│   └── admin.ts             # Super admin email check
├── types/
│   └── database.ts          # TypeScript interfaces for all DB tables
└── middleware.ts             # Auth protection + subscription gating
supabase/
└── migrations/
    ├── 001_initial_schema.sql      # Users, businesses, calls, leads, subscriptions, referrals
    └── 002_ai_receptionist.sql     # ai_prompt column + ai_conversations table
public/
├── privacy.html
└── terms.html
```

## Environment Variables

Create `.env.local` with:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_ID=price_...

# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_MESSAGING_SERVICE_SID=MG...    # For 10DLC compliance

# App
NEXT_PUBLIC_APP_URL=https://247frontrunner.com
SUPER_ADMIN_EMAILS=admin@example.com

# AI Voice Receptionist (optional — only needed if using AI feature)
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL   # Optional, defaults to "Sarah"
```

## Database Setup

Run both migrations in the Supabase SQL Editor in order:

1. `supabase/migrations/001_initial_schema.sql` — Core tables, RLS policies, indexes, triggers
2. `supabase/migrations/002_ai_receptionist.sql` — AI receptionist feature (ai_prompt column + ai_conversations table)

## Local Development

```bash
npm install
npm run dev       # http://localhost:3000
```

## How It Works

### Call Flow (without AI)
```
Customer calls business → Twilio forwards to owner's phone (20s ring)
  → Owner answers → normal call
  → Owner doesn't answer → Twilio POSTs to /api/twilio/voice?action=status
    → Log missed call → Send auto-SMS → Create lead
    → Play "we missed your call" → Hangup
```

### Call Flow (with AI Receptionist)
```
Customer calls business → Twilio forwards to owner's phone (20s ring)
  → Owner doesn't answer → Check if business has ai_prompt set
    → YES: Create ai_conversations row → OpenAI generates greeting
      → TwiML: <Gather><Play tts audio/></Gather>
      → Caller speaks → Twilio STT → POST /api/twilio/ai-voice
      → Load conversation → OpenAI generates response → Save to DB
      → Repeat for up to 4 turns or until [END] signal
      → Extract name + reason → Save transcript to lead → Send SMS → Hangup
    → NO: Static "we missed your call" message + SMS (original flow)
```

### SMS Flow
```
Caller texts back → POST /api/twilio/sms → Create/update lead with message
```

## Stripe Setup

1. Create a product in Stripe with a $79/month recurring price
2. Copy the Price ID to `STRIPE_PRICE_ID`
3. Set up webhook endpoint: `{APP_URL}/api/stripe/webhook`
4. Events to listen for: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

## Twilio Setup

1. Get Account SID and Auth Token from the Twilio console
2. Phone numbers are auto-provisioned when a business is created (if user has active subscription)
3. Webhook URLs are automatically configured on purchased numbers:
   - Voice: `{APP_URL}/api/twilio/voice`
   - SMS: `{APP_URL}/api/twilio/sms`

## Key Architecture Decisions

- **Lazy-initialized clients** — Stripe, Twilio, and Supabase admin clients are lazy-initialized to avoid build-time env var errors on Vercel
- **No Twilio SDK for SMS** — Uses direct REST API calls (`src/lib/twilio.ts`) to reduce bundle size
- **Twilio SDK for TwiML only** — The `twilio` npm package is only used for `VoiceResponse` TwiML generation
- **Serverless-compatible AI voice** — Turn-based conversation via `<Gather input="speech">` works fully on Vercel serverless (no WebSockets needed)
- **RLS on all tables** — Row-level security policies ensure users only see their own data; API routes use `supabaseAdmin` (service role) for webhook operations
- **Middleware subscription gating** — `src/middleware.ts` checks subscription status and redirects to checkout for protected routes

## Deploy to Vercel

1. Push to GitHub
2. Connect repo to Vercel
3. Add all env vars in Vercel dashboard
4. Set up Stripe webhook endpoint
5. Twilio voice/SMS webhook URLs are set automatically when numbers are provisioned

## What's Next

- Test the full AI voice receptionist end-to-end with a real call
- Verify ElevenLabs TTS latency is acceptable (~500ms target)
- Add conversation transcript view in the leads UI
- Add OPENAI_API_KEY and ELEVENLABS_API_KEY to Vercel env vars
- Run `002_ai_receptionist.sql` migration in Supabase SQL editor
