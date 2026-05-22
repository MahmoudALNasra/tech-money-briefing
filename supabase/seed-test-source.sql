-- Run after schema.sql / migration. Replace RSS URL with a feed in your niche.
insert into public.sources (name, rss_url, category, is_active)
values (
  'TechCrunch AI',
  'https://techcrunch.com/category/artificial-intelligence/feed/',
  'ai-in-healthcare',
  true
)
on conflict (rss_url) do nothing;
