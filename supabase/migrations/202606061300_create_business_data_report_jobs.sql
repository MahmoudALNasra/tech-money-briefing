-- Cancellable business data report jobs with partial credit charging

create table if not exists public.business_data_report_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  status text not null default 'running'
    check (status in ('running', 'completed', 'cancelled', 'failed')),
  requested_count integer not null check (requested_count > 0),
  processed_count integer not null default 0 check (processed_count >= 0),
  processed_index integer not null default 0 check (processed_index >= 0),
  charged_credits integer not null default 0 check (charged_credits >= 0),
  cache_key text not null,
  query jsonb not null default '{}'::jsonb,
  results jsonb not null default '[]'::jsonb,
  csv text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz
);

create index if not exists business_data_report_jobs_user_created_idx
  on public.business_data_report_jobs (user_id, created_at desc);

create index if not exists business_data_report_jobs_status_updated_idx
  on public.business_data_report_jobs (status, updated_at desc);

alter table public.business_data_report_jobs enable row level security;
