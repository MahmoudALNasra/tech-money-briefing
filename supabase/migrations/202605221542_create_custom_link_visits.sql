create table if not exists public.custom_link_visits (
  id uuid primary key default gen_random_uuid(),
  campaign text not null,
  destination_path text not null default '/',
  ip_hash text,
  user_agent text,
  user_agent_hash text,
  referrer text,
  accept_language text,
  country text,
  region text,
  city text,
  host text,
  created_at timestamptz not null default now()
);

create index if not exists custom_link_visits_campaign_created_at_idx
  on public.custom_link_visits (campaign, created_at desc);

create index if not exists custom_link_visits_created_at_idx
  on public.custom_link_visits (created_at desc);

alter table public.custom_link_visits enable row level security;
