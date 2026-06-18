create table if not exists public.social_post_drafts (
  id uuid primary key default gen_random_uuid(),
  run_label text not null default 'daily',
  source_type text not null check (
    source_type in (
      'enrichment_example',
      'aggregate_stat',
      'product_detail',
      'article_link'
    )
  ),
  source_payload jsonb not null default '{}'::jsonb,
  linkedin_draft text not null,
  instagram_caption text not null,
  instagram_visual_direction text not null,
  linkedin_opening text not null,
  instagram_opening text not null,
  repetition_warning text,
  posted_linkedin_at timestamptz,
  posted_instagram_at timestamptz,
  email_sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists social_post_drafts_created_at_idx
  on public.social_post_drafts (created_at desc);

create index if not exists social_post_drafts_source_type_created_idx
  on public.social_post_drafts (source_type, created_at desc);

alter table public.social_post_drafts enable row level security;
