alter table public.article_media
  add column if not exists alt_text text,
  add column if not exists caption text,
  add column if not exists source_name text,
  add column if not exists source_url text;

alter table public.article_media
  drop constraint if exists article_media_provider_check;

alter table public.article_media
  add constraint article_media_provider_check
  check (provider in ('youtube', 'image'));

alter table public.article_media
  drop constraint if exists article_media_position_check;

alter table public.article_media
  add constraint article_media_position_check
  check (position >= 0 and position < 6);
