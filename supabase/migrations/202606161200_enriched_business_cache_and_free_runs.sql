-- Cross-user enrichment cache keyed by Google place_id.
create table if not exists public.enriched_business_cache (
  place_id text primary key,
  source_place_data_hash text not null,
  enrichment jsonb not null,
  enriched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists enriched_business_cache_enriched_at_idx
  on public.enriched_business_cache (enriched_at desc);

-- Lifetime free enriched runs per authenticated account.
create table if not exists public.business_data_free_runs (
  user_id uuid primary key references auth.users (id) on delete cascade,
  runs_used integer not null default 0 check (runs_used >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Soft cap: one anonymous enriched run per IP fingerprint (run 1 without account).
create table if not exists public.business_data_anonymous_free_runs (
  fingerprint text primary key,
  runs_used integer not null default 0 check (runs_used >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
