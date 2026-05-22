create table if not exists public.subscribers (
  id text primary key,
  email text not null unique,
  source text not null default 'homepage_grid',
  created_at timestamptz not null default now(),
  constraint subscribers_id_format_check check (id ~ '^[a-z0-9]{8}$'),
  constraint subscribers_email_format_check check (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
);

create unique index if not exists subscribers_email_unique_idx
  on public.subscribers (email);

create index if not exists subscribers_created_at_idx
  on public.subscribers (created_at desc);

alter table public.subscribers enable row level security;
