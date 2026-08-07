# Aryam's Jewelry مجوهرات أريام — One-Page Website

Static, self-contained one-page site for **Aryam's Jewelry**, an Arabic gold jewelry store at
6400 Southwest Fwy, Houston, TX 77074 · (832) 762-7620.

Built to be dropped into an existing domain as a subfolder (e.g. `techrevenuebrief.com/aryam/`).
No build step, no server-side code, no API keys required.

## Folder contents

```
index.html      The entire site (content, SEO meta, JSON-LD structured data)
css/styles.css  Design system (dark + gold luxury theme, responsive)
js/main.js      Scroll animations, live gold prices, open-now badge
images/         Photos (see "Replace placeholder images" below), favicon
sitemap.xml     Single-URL sitemap for the subfolder
```

## Deploying under the domain

1. Copy this whole folder to the web root so it is served at `/aryam/`
   (i.e. `index.html` responds at `https://techrevenuebrief.com/aryam/`).
2. **If you mount it at a different path**, find-and-replace the string
   `techrevenuebrief.com/aryam` in `index.html` (canonical, Open Graph, JSON-LD)
   and `sitemap.xml`. All asset paths are **relative**, so the site itself works at
   any path with no changes.
3. Reference `sitemap.xml` from the root `robots.txt`
   (`Sitemap: https://techrevenuebrief.com/aryam/sitemap.xml`) or merge the URL
   into the domain's main sitemap.
4. Serve over HTTPS (required for the live gold price fetch — the API is HTTPS-only).

## Important follow-ups for the owner

- **Replace placeholder images.** The photos in `images/` are AI-generated placeholders
  in a consistent luxury style. Replace them with real store photos (the Google Business
  Profile photos and TikTok videos are a good source) **keeping the same filenames**:
  `hero.jpg` (landscape), `interior.jpg` (landscape), and the five portrait card images
  `bridal-set.jpg`, `bangles.jpg`, `necklaces.jpg`, `rings.jpg`, `gold-coins.jpg`.
  Keep them under ~300 KB each for page speed.
- **TikTok link.** The listing mentions a TikTok profile but the handle could not be
  verified. Search `index.html` for `TikTok` — there is a ready commented-out block in
  the "Visit" section; set the real profile URL and uncomment it.
- **Google Business Profile.** Once live, add `https://techrevenuebrief.com/aryam/`
  as the website on the Google Business Profile ("Add website"). This is the single
  biggest local-SEO win and makes the live URL show on Maps.
- **Verify soft claims.** The copy assumes the store carries 18K/21K/22K/24K, gold
  coins/bars, and serves customers in Arabic — standard for Arabic gold stores, but
  confirm with the owner and adjust the Collections/FAQ sections if needed.
- **Hero video (optional).** If the store provides a short showroom video, the hero
  image can be swapped for a muted looping `<video>` for even more motion.

## Live data used by the page

- **Gold spot price:** `https://api.gold-api.com/price/XAU` — free, no API key,
  unlimited real-time requests. Fetched on load and every 60 s; per-gram prices for
  24K/22K/21K/18K are computed client-side (spot ÷ 31.1035 g/ozt × purity).
  If the API is unreachable the page falls back to the last cached price
  (localStorage) or a graceful "call us" message.
- **Gold chart:** TradingView free embed widget (XAU/USD, 12-month view). No key.
- **Map:** standard Google Maps embed iframe. No key.
- Ticker, price table and timestamps all render in Houston time (America/Chicago).

## SEO / GEO notes (what's already in place)

- `JewelryStore` JSON-LD with NAP, geo coordinates (29.7205597, -95.4973634),
  opening hours, 4.9★/172 aggregate rating and three real review snippets.
- `FAQPage` JSON-LD mirroring the visible FAQ (targets "gold price in Houston today",
  "arabic jewelry houston", karat questions — good for AI/answer-engine visibility).
- Geo meta tags, canonical URL, Open Graph/Twitter cards, keyword-rich alt text,
  bilingual EN/AR content, semantic headings.
- Local keywords woven into copy: Arabic gold jewelry Houston, 21K/22K gold,
  gold price per gram, Southwest Freeway / Hillcroft / Sharpstown area references.

## Future e-commerce

The Collections section is structured as product-category cards (`.collection-card`).
When the store is ready to sell online, each card can become a category page or link
into a shop platform without redesigning the page.

## Preview locally

Open `index.html` directly in a browser, or from this folder run:

```powershell
python -m http.server 8080
```

then visit `http://localhost:8080`. (A local server is closer to production —
the browser applies CORS and lazy-loading the same way.)
