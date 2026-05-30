create table if not exists public.monetization_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  site_url text not null,
  goal text not null,
  notes text,
  source text not null default 'audit_form',
  created_at timestamptz not null default now(),
  constraint monetization_leads_email_format_check check (
    email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  ),
  constraint monetization_leads_goal_check check (
    goal in ('ads', 'affiliate', 'newsletter', 'sponsorship', 'mixed', 'other')
  )
);

create index if not exists monetization_leads_created_at_idx
  on public.monetization_leads (created_at desc);

create index if not exists monetization_leads_goal_idx
  on public.monetization_leads (goal, created_at desc);

alter table public.monetization_leads enable row level security;
