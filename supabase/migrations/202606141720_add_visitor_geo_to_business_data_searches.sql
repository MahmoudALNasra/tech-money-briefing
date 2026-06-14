-- Add visitor-side geography to business data search logs.

alter table public.business_data_searches
  add column if not exists visitor_country text,
  add column if not exists visitor_region text,
  add column if not exists visitor_city text;

create index if not exists business_data_searches_visitor_country_created_idx
  on public.business_data_searches (visitor_country, created_at desc);

create index if not exists business_data_searches_visitor_city_created_idx
  on public.business_data_searches (visitor_city, created_at desc);
