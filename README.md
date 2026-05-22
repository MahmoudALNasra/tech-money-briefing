# Automated News Aggregator

Foundation for a fully automated hyper-niche B2B industry aggregator built with Next.js App Router, Tailwind CSS, Supabase PostgreSQL, RSS ingestion, OpenAI analyst rewriting, native ad placements, newsletter capture, and server-rendered SEO surfaces.

## Project Structure

```txt
app/
  api/cron/ingest/route.ts       Vercel Cron ingestion endpoint
  [category]/page.tsx            SSR category route
  [category]/[slug]/page.tsx     SSR article route with metadata + JSON-LD
  globals.css                    Tailwind globals and base layout styles
  layout.tsx                     Root metadata, GTM, ad script, fonts
  page.tsx                       Homepage article feed
  robots.ts                      Dynamic robots.txt
  sitemap.ts                     Cached dynamic sitemap.xml
components/
  ads/NativeAdCard.tsx           CLS-safe native ad unit
  analytics/ArticleReadTracker.tsx Article page_view + 50% read events
  analytics/GoogleTagManager.tsx GTM container loader
  articles/ArticleCard.tsx       Square article card
  articles/ArticleGrid.tsx       Feed grid with interval ad/newsletter injection
  newsletter/NewsletterCapture.tsx B2B email capture card
hooks/
  useDataLayer.ts                Publisher dataLayer event hook
lib/
  articles.ts                    Server-side article queries
  ingestion.ts                   RSS + OpenAI analyst + Supabase ingestion engine
  seo.ts                         OpenGraph/JSON-LD helpers
  share-id.ts                    8-char lowercase alphanumeric hash generator
  site.ts                        Site URL/name helpers
  slug.ts                        Slug/category normalization
  supabase.ts                    Server Supabase client
  types.ts                       Shared TypeScript models
scripts/
  ingest-cron.ts                 Local node-cron worker
supabase/
  schema.sql                     Database tables, indexes, checks, RLS policies
```

## Setup

1. Copy `.env.example` to `.env.local` (Next.js only reads `.env.local`, not `.env.example`).
2. Set `SUPABASE_URL` to your **API URL**: `https://<project-ref>.supabase.co` (from Supabase → Project Settings → API). Do not use the dashboard URL.
3. In Supabase SQL Editor, run `supabase/schema.sql`, then `supabase/migrations/202605220146_add_key_takeaways.sql` if the DB already existed.
4. Add at least one row to `sources` (see `supabase/seed-test-source.sql`).
5. `npm install`
6. `npm run dev` — open http://localhost:3000
7. `npm run ingest` — one-off RSS + AI pipeline (uses OpenAI credits)

## Local testing checklist

| Step | Command / action | Expected result |
|------|------------------|-----------------|
| DB | Run schema + migration SQL | `articles` and `sources` tables exist |
| Seed | Insert a `sources` row | At least one active RSS feed |
| App | `npm run dev` | Homepage loads (empty state until ingest) |
| Ingest | `npm run ingest` | JSON log with `inserted: 1+` |
| UI | Refresh homepage | Cards show titles + 3 takeaways |
| Article | Click a card | `/[category]/[slug]` with analyst block |
| Cron API | `curl` with `Authorization: Bearer $CRON_SECRET` | Same result as `npm run ingest` |
| Sitemap | http://localhost:3000/sitemap.xml | Lists published URLs |

## Cron

Vercel Cron is configured in `vercel.json` to call `/api/cron/ingest` every 12 hours. If `CRON_SECRET` is set, call the endpoint with:

```bash
Authorization: Bearer <CRON_SECRET>
```

For a persistent local worker, run:

```bash
npm run ingest:watch
```
