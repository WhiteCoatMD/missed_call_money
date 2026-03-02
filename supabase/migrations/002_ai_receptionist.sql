-- AI Receptionist Feature
-- Adds AI voice conversation support to missed calls

-- Add AI prompt field to businesses (empty = feature disabled)
alter table public.businesses add column ai_prompt text default '';

-- AI conversation tracking table
create table public.ai_conversations (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  caller_number text not null,
  call_sid text,
  messages jsonb default '[]'::jsonb,
  extracted_name text,
  extracted_reason text,
  turn_count integer default 0,
  status text not null default 'active' check (status in ('active', 'completed', 'error')),
  created_at timestamptz default now()
);

alter table public.ai_conversations enable row level security;

create policy "Users can read own ai_conversations" on public.ai_conversations
  for select using (
    business_id in (select id from public.businesses where user_id = auth.uid())
  );

-- Service role can insert/update (used by API routes via supabaseAdmin)
-- No RLS policy needed for service role as it bypasses RLS

create index idx_ai_conversations_business_id on public.ai_conversations(business_id);
create index idx_ai_conversations_call_sid on public.ai_conversations(call_sid);
