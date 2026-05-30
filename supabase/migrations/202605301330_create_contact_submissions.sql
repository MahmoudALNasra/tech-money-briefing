create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  topic text not null,
  page_url text,
  message text not null,
  source text not null default 'contact_page',
  created_at timestamptz not null default now(),
  constraint contact_submissions_email_format_check check (
    email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  ),
  constraint contact_submissions_topic_check check (
    topic in ('help', 'strategy', 'correction', 'source', 'sponsorship', 'partnership', 'other')
  )
);

create index if not exists contact_submissions_created_at_idx
  on public.contact_submissions (created_at desc);

create index if not exists contact_submissions_topic_created_at_idx
  on public.contact_submissions (topic, created_at desc);

alter table public.contact_submissions enable row level security;
