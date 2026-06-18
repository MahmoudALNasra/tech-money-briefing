alter table public.social_post_drafts
  add column if not exists branded_image_variants jsonb;
