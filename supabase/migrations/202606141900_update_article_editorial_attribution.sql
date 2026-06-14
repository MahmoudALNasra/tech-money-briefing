-- Make existing generated articles use Tech Revenue Brief editorial attribution
-- while removing generated Source footers from article bodies.

update public.articles
set
  content = trim(
    regexp_replace(
      content,
      E'\\n{0,2}(\\*\\*)?Source( Attribution)?(\\*\\*)?:[^\\n]*(\\n\\s*(Read more|Visit|Original source):[^\\n]*)?',
      '',
      'gi'
    )
  ),
  updated_at = now()
where
  status in ('published', 'draft')
  and content ~* E'(^|\\n)(\\*\\*)?Source( Attribution)?(\\*\\*)?:';

update public.articles
set
  source_name = 'Tech Revenue Brief Editors',
  updated_at = now()
where
  status in ('published', 'draft')
  and source_name <> 'Tech Revenue Brief Editors'
  and source_name not ilike '%Referral%';
