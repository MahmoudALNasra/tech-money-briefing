-- Structured log of business data generator searches for analytics

create table if not exists public.business_data_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  session_key text,
  category text not null,
  location text,
  center_label text,
  center_lat numeric(10, 7),
  center_lng numeric(10, 7),
  radius_meters integer not null default 0,
  result_count integer not null default 0,
  total_available_estimate integer not null default 0,
  paid_access boolean not null default false,
  provider text not null default 'google_places',
  estimated_cost_usd numeric(10, 4) not null default 0,
  result_names jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists business_data_searches_created_idx
  on public.business_data_searches (created_at desc);

create index if not exists business_data_searches_category_created_idx
  on public.business_data_searches (category, created_at desc);

create index if not exists business_data_searches_center_label_created_idx
  on public.business_data_searches (center_label, created_at desc);

create index if not exists business_data_searches_user_created_idx
  on public.business_data_searches (user_id, created_at desc);

alter table public.business_data_searches enable row level security;
