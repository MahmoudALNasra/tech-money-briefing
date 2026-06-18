alter table public.articles
  add column if not exists published_on_instagram_at timestamptz,
  add column if not exists published_on_linkedin_at timestamptz;

create index if not exists articles_published_on_instagram_at_idx
  on public.articles (published_on_instagram_at desc nulls last)
  where published_on_instagram_at is not null;

create index if not exists articles_published_on_linkedin_at_idx
  on public.articles (published_on_linkedin_at desc nulls last)
  where published_on_linkedin_at is not null;
