-- Missed Call Money - Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  referral_code text unique default encode(gen_random_bytes(6), 'hex'),
  referred_by uuid references public.users(id),
  created_at timestamptz default now()
);

alter table public.users enable row level security;

create policy "Users can read own data" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own data" on public.users
  for update using (auth.uid() = id);

-- ============================================================
-- BUSINESSES (multi-business per user)
-- ============================================================
create table public.businesses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  business_name text not null,
  phone_number text,
  twilio_number text,
  average_job_value numeric default 0,
  close_rate numeric default 0.3,
  auto_reply_template text default 'Sorry we missed your call. How can we help you today?',
  white_label_enabled boolean default false,
  white_label_name text,
  white_label_logo_url text,
  badge_enabled boolean default false,
  created_at timestamptz default now()
);

alter table public.businesses enable row level security;

create policy "Users can CRUD own businesses" on public.businesses
  for all using (auth.uid() = user_id);

-- ============================================================
-- CALLS
-- ============================================================
create table public.calls (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  caller_number text not null,
  call_status text not null check (call_status in ('answered', 'missed')),
  call_sid text,
  created_at timestamptz default now()
);

alter table public.calls enable row level security;

create policy "Users can read own calls" on public.calls
  for select using (
    business_id in (select id from public.businesses where user_id = auth.uid())
  );

-- ============================================================
-- LEADS
-- ============================================================
create table public.leads (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  caller_number text not null,
  name text,
  message_thread jsonb default '[]'::jsonb,
  converted boolean default false,
  revenue_value numeric default 0,
  created_at timestamptz default now()
);

alter table public.leads enable row level security;

create policy "Users can CRUD own leads" on public.leads
  for all using (
    business_id in (select id from public.businesses where user_id = auth.uid())
  );

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'inactive' check (status in ('active', 'inactive', 'canceled', 'past_due')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.subscriptions enable row level security;

create policy "Users can read own subscription" on public.subscriptions
  for select using (auth.uid() = user_id);

-- ============================================================
-- REFERRALS
-- ============================================================
create table public.referrals (
  id uuid primary key default uuid_generate_v4(),
  referrer_id uuid not null references public.users(id) on delete cascade,
  referred_id uuid not null references public.users(id) on delete cascade,
  status text default 'pending' check (status in ('pending', 'converted', 'paid')),
  reward_amount numeric default 0,
  created_at timestamptz default now()
);

alter table public.referrals enable row level security;

create policy "Users can read own referrals" on public.referrals
  for select using (auth.uid() = referrer_id);

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_businesses_user_id on public.businesses(user_id);
create index idx_calls_business_id on public.calls(business_id);
create index idx_calls_created_at on public.calls(created_at);
create index idx_leads_business_id on public.leads(business_id);
create index idx_leads_caller_number on public.leads(caller_number);
create index idx_subscriptions_user_id on public.subscriptions(user_id);
create index idx_subscriptions_stripe_customer on public.subscriptions(stripe_customer_id);
create index idx_referrals_referrer on public.referrals(referrer_id);

-- ============================================================
-- FUNCTION: Auto-create user record on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- FUNCTION: Get dashboard stats for a business
-- ============================================================
create or replace function public.get_business_stats(p_business_id uuid)
returns json as $$
declare
  result json;
begin
  select json_build_object(
    'missed_calls_30d', (
      select count(*) from public.calls
      where business_id = p_business_id
        and call_status = 'missed'
        and created_at > now() - interval '30 days'
    ),
    'total_leads', (
      select count(*) from public.leads
      where business_id = p_business_id
    ),
    'revenue_recovered', (
      select coalesce(sum(revenue_value), 0) from public.leads
      where business_id = p_business_id
        and converted = true
    ),
    'revenue_recovered_this_month', (
      select coalesce(sum(revenue_value), 0) from public.leads
      where business_id = p_business_id
        and converted = true
        and created_at >= date_trunc('month', now())
    )
  ) into result;
  return result;
end;
$$ language plpgsql security definer;
