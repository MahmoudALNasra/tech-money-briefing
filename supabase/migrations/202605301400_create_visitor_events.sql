create table if not exists public.visitor_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  visitor_id text not null,
  session_id text not null,
  page_path text,
  page_title text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  article_id text,
  article_slug text,
  category text,
  metadata jsonb not null default '{}'::jsonb,
  country text,
  region text,
  city text,
  ip_hash text,
  user_agent_hash text,
  device_type text,
  viewport_width integer,
  viewport_height integer,
  timezone text,
  language text,
  host text,
  created_at timestamptz not null default now()
);

create index if not exists visitor_events_created_at_idx
  on public.visitor_events (created_at desc);

create index if not exists visitor_events_event_name_created_at_idx
  on public.visitor_events (event_name, created_at desc);

create index if not exists visitor_events_session_id_created_at_idx
  on public.visitor_events (session_id, created_at desc);

create index if not exists visitor_events_page_path_created_at_idx
  on public.visitor_events (page_path, created_at desc);

create index if not exists visitor_events_visitor_id_created_at_idx
  on public.visitor_events (visitor_id, created_at desc);

alter table public.visitor_events enable row level security;
