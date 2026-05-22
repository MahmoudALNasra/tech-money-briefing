create extension if not exists "pgcrypto";

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rss_url text not null unique,
  category text not null,
  is_active boolean not null default true,
  last_scraped_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.subscribers (
  id text primary key,
  email text not null unique,
  source text not null default 'homepage_grid',
  created_at timestamptz not null default now(),
  constraint subscribers_id_format_check check (id ~ '^[a-z0-9]{8}$'),
  constraint subscribers_email_format_check check (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null,
  content text not null,
  meta_description text not null,
  key_takeaways jsonb not null default '[]'::jsonb,
  category text not null,
  source_name text not null,
  source_url text not null,
  image_url text,
  share_id text not null,
  status text not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint articles_status_check check (status in ('published', 'draft')),
  constraint articles_share_id_format_check check (share_id ~ '^[a-z0-9]{8}$'),
  constraint articles_key_takeaways_array_check check (jsonb_typeof(key_takeaways) = 'array')
);

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

create unique index if not exists articles_slug_unique_idx
  on public.articles (slug);

create unique index if not exists articles_source_url_unique_idx
  on public.articles (source_url);

create unique index if not exists articles_share_id_unique_idx
  on public.articles (share_id);

create index if not exists articles_category_published_at_idx
  on public.articles (category, published_at desc)
  where status = 'published';

create index if not exists articles_published_at_idx
  on public.articles (published_at desc)
  where status = 'published';

create index if not exists sources_active_idx
  on public.sources (is_active, category);

create index if not exists custom_link_visits_campaign_created_at_idx
  on public.custom_link_visits (campaign, created_at desc);

create index if not exists custom_link_visits_created_at_idx
  on public.custom_link_visits (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_articles_updated_at on public.articles;

create trigger set_articles_updated_at
before update on public.articles
for each row
execute function public.set_updated_at();

alter table public.sources enable row level security;
alter table public.subscribers enable row level security;
alter table public.articles enable row level security;
alter table public.custom_link_visits enable row level security;

drop policy if exists "Public can read active sources" on public.sources;
create policy "Public can read active sources"
on public.sources
for select
using (is_active = true);

drop policy if exists "Public can read published articles" on public.articles;
create policy "Public can read published articles"
on public.articles
for select
using (status = 'published');
