create table if not exists public.article_media (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  provider text not null default 'youtube',
  provider_id text not null,
  title text not null,
  thumbnail_url text,
  url text not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint article_media_provider_check check (provider in ('youtube')),
  constraint article_media_position_check check (position >= 0 and position < 3)
);

create unique index if not exists article_media_article_provider_id_idx
  on public.article_media (article_id, provider, provider_id);

create index if not exists article_media_article_position_idx
  on public.article_media (article_id, position asc);

alter table public.article_media enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'article_media'
      and policyname = 'article_media_public_select'
  ) then
    create policy article_media_public_select
      on public.article_media
      for select
      using (true);
  end if;
end;
$$;
