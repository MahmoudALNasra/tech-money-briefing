-- Remove generated bottom link/tool sections from stored article markdown.

update public.articles
set
  content = trim(
    regexp_replace(
      content,
      E'\\n{0,2}##\\s+(Related on Tech Revenue Brief|Tools mentioned in this guide|Useful tools for this trend)\\b[\\s\\S]*?(?=\\n##\\s+|\\s*$)',
      '',
      'gi'
    )
  ),
  updated_at = now()
where
  content ~* E'(^|\\n)##\\s+(Related on Tech Revenue Brief|Tools mentioned in this guide|Useful tools for this trend)\\b';
