-- Business data token wallets, ledger, and usage events

create table if not exists public.business_data_wallets (
  user_id uuid primary key,
  balance integer not null default 0 check (balance >= 0),
  lifetime_credited integer not null default 0,
  lifetime_debited integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_data_token_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  delta integer not null,
  balance_after integer not null,
  reason text not null,
  stripe_session_id text,
  stripe_event_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists business_data_token_ledger_stripe_session_unique
  on public.business_data_token_ledger (stripe_session_id)
  where stripe_session_id is not null;

create unique index if not exists business_data_token_ledger_stripe_event_unique
  on public.business_data_token_ledger (stripe_event_id)
  where stripe_event_id is not null;

create index if not exists business_data_token_ledger_user_created_idx
  on public.business_data_token_ledger (user_id, created_at desc);

create table if not exists public.business_data_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  session_key text,
  event_type text not null,
  tokens_charged integer not null default 0,
  estimated_cost_usd numeric(10, 4) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists business_data_usage_events_created_idx
  on public.business_data_usage_events (created_at desc);

create index if not exists business_data_usage_events_type_created_idx
  on public.business_data_usage_events (event_type, created_at desc);

create index if not exists business_data_usage_events_user_created_idx
  on public.business_data_usage_events (user_id, created_at desc);

alter table public.business_data_wallets enable row level security;
alter table public.business_data_token_ledger enable row level security;
alter table public.business_data_usage_events enable row level security;
