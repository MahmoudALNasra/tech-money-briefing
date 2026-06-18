alter table public.enriched_business_cache
  add column if not exists search_category text,
  add column if not exists area_label text;
