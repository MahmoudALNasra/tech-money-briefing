alter table public.articles
add column if not exists key_takeaways jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'articles_key_takeaways_array_check'
  ) then
    alter table public.articles
    add constraint articles_key_takeaways_array_check
    check (jsonb_typeof(key_takeaways) = 'array');
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'articles_share_id_format_check'
  ) then
    alter table public.articles
    add constraint articles_share_id_format_check
    check (share_id ~ '^[a-z0-9]{8}$');
  end if;
end;
$$;
