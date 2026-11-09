# Project decisions

Why the site is built the way it is, and what was traded away. Written for the owner and for any future developer.

## 1. Starting point

The repository held a single-page static site (`index.html`, `Catalog/catalog.html`, `imgs/`) served by GitHub Pages at naraori.in. A separate Supabase project ("naraori") held an earlier "workspace" idea: project notes, products, inquiries, subscribers.

The owner asked for a fresh website and **no changes to that workspace**. So:

- The old database was only **read** (to recover the artist's own project notes and two published progress updates). Nothing in it was modified.
- The new order system ships as a **new migration** (`supabase/migrations/`) intended for a **new Supabase project**. It uses different table names, so it would not collide even if applied to the old one, but a fresh project is recommended.
- Every fact on the site comes from the artist's previous site, the artist's own notes, or the build brief. Unknown facts are shown as "Not yet documented", never guessed. See `OWNER_CHECKLIST.md`.

## 2. Visual system

**Current system: "Studio Black"** (chosen by the owner, November 2026). The whole site sits on `#11100f`, the black of the studio backdrop the sculptures are photographed against, so the homepage turntable video melts into the page. Type is warm light (`#ece7de`, `#c4bdb1`, `#9b9387`) and the single accent is a lifted sindoor `#de8058`. Every text colour was checked against every background: all are 5.7:1 or better (WCAG AA needs 4.5:1).

The first version used "Washi and Ink" (warm paper `#f3efe7`, ink type, dark mounts). It was replaced because the owner wanted one continuous black ground. Artwork mounts keep their individual colours, which now read as slightly lifted panels on the black.

**Design grammar** (what makes it this site and not a template):

- **The crease**: a single hairline with a 45° notch, used for section heads and rules, never boxes.
- **The edge rail**: the artist's name runs vertically along the left edge of the sheet on wide screens.
- **Archival captions**: catalogue numbers, sheet size and grid in IBM Plex Mono, like museum labels.
- **Mounts**: dark fields with one faint code-drawn crease at 22.5° (the box-pleating angle). Clearly interface geometry, never mistaken for a photograph.
- **Specimen controls**: colour chips with a folded corner and a text label; sizes as a ledger.
- **Composition**: the homepage and archive hang works at different proportions and offsets, like an exhibition wall, not a card grid. On phones everything becomes one calm column.

**Typography**: Newsreader (editorial serif, display and long reading), Source Sans 3 (interface), IBM Plex Mono (catalogue metadata). All SIL Open Font License, self-hosted from `app/fonts/`, latin subset only, with metric-matched fallbacks so nothing jumps when fonts arrive.

## 3. Motion

- **Homepage turntable**: the artist's 360° studio video, converted to 180 WebP stills (one every 2°), drawn on a canvas. Scroll position chooses the angle; neighbouring frames are cross-blended so the motion is continuous between stills; easing is time-based (same feel at 60 Hz and 120 Hz); the scroll position is computed from cached geometry (no layout reads while scrolling); frames load coarse-to-fine and the canvas never jumps more than 6° while loading. Measured draw cost: about 0.1 ms per frame. Reduced motion gets a slider; no JavaScript gets a still.

- **Fold transition** between pages: the old page folds shut toward a vertical crease at 38% of the width (about 170 ms), the new page opens from that crease (about 380 ms). It uses React's `<ViewTransition>` and the browser View Transitions API: no animation library, no WebGL.
- **Shared element**: an artwork image morphs from the archive into its Fold File.
- **Paper Atlas**: the highlighted sheet expands from the shared corner when you change size.
- **Unfold the story**: native `<details>` layers that open with a height transition where supported.
- Browsers without View Transitions simply navigate. `prefers-reduced-motion` turns every animation off. Nothing waits for an animation before content is usable.

## 4. Architecture

```
app/              routes (App Router). Public pages are static or cached; studio and API are dynamic
components/       UI (header, mounts, Paper Atlas, forms, zoom viewer)
content/          EDITABLE CONTENT: identity, artworks, projects, catalogue, learn/*.md, journal/*.md
lib/
  shop/           pricing (the only place totals are computed), money, catalogue types
  orders/         validation schemas, statuses, submission service
  store/          storage interface + Supabase and local-file implementations
  email/          templates (HTML + plain text) and senders
  notifications   outbox delivery and retries
  seo             metadata and JSON-LD
  auth            studio login (password hash + signed cookie)
supabase/         SQL migration
tests/            unit (Vitest), e2e (Playwright + axe), db (PostgreSQL permission tests)
```

### Content: files, not a CMS

Artworks, projects and articles are plain files in `content/`. The owner edits them in GitHub's web editor; Vercel redeploys automatically. Trade-off: no WYSIWYG editor, but nothing extra to host, secure or pay for, every change is versioned, and pages stay fully static (fast, crawlable). Drafts use `state: "draft"` and are filtered out in one place, so they never reach pages, the sitemap or search.

### Commerce data: database overrides on top of file defaults

Product descriptions live in `content/catalogue.ts`. Prices, minimum quantities, availability and visibility can be **overridden from the studio dashboard** and are stored in Supabase (`catalogue_options`, `catalogue_products`). If the database is unreachable, the shop falls back to the file defaults instead of breaking. Trade-off: two places to look, but the owner can change a price in seconds without a deploy, and copy stays versioned.

### Orders: request, not checkout

- Totals are computed **only on the server** (`lib/shop/pricing.ts`) from trusted records, in integer paise. Prices sent by a browser are ignored (tested).
- Each request stores a **snapshot** of names, sizes, colours and prices, so later price changes never alter it.
- **Idempotency**: each order sheet carries a UUID. The database enforces it as unique and `create_order_request()` uses `ON CONFLICT DO NOTHING`, so double clicks, retries and concurrent duplicates create one request (tested, including concurrently).
- Creation is **atomic**: one PostgreSQL function inserts the request, items, status history and email jobs in a single transaction.
- **Inventory is not decremented** for requests. There is no reservation policy yet, so stock is confirmed by hand. This is deliberate.
- Status starts at `requested`. Only the owner changes it. The customer is never told "confirmed" or "paid" by the system.
- **Spam**: hidden honeypot field, a minimum time on the form, a per-IP rate limit, size limits on bodies.
- **Confirmation URL** uses a random 128-bit token, not the reference, and shows no personal data.

### Email: an outbox, so nothing is lost

The request is saved first. Two email jobs are written in the same transaction. They are then sent through Resend with the job id as Resend's `Idempotency-Key`, so a retry can never send the same email twice. Failures are recorded with the error, shown in the dashboard with a Retry button, and retried daily by Vercel Cron. The customer confirmation page tells the truth if its email could not be sent.

### Security

- Every new table has RLS **enabled and forced**, **no policies**, and all privileges **revoked** from `anon` and `authenticated`. Nothing is readable through Supabase's public API, even with the public key. Only the server, holding the secret key, can read or write. This is verified by `tests/db/` (which also proves it fails if a grant is added).
- The secret key is only read in server modules marked `server-only`; it can never be bundled for the browser.
- **Studio login**: there are no customer accounts, so "signed in" can only mean the owner. A scrypt password hash in an environment variable, compared in constant time, plus an HMAC-signed, HttpOnly, SameSite=Strict, Secure cookie (12 hours). Every studio page and action re-checks it. Login attempts are rate limited.
  - Trade-off: single user, no password-reset email. Upgrade path if more people need access: Supabase Auth with an `owners` allow-list.
- CSV export neutralises spreadsheet formula injection.
- `/studio`, `/api`, confirmations and search are excluded from indexing by header, meta tag and robots.txt.

### Known limitations

- **Rate limiting is in memory**, so on serverless hosting each instance counts separately. Fine for this traffic; upgrade path is a Supabase table or Vercel's firewall rules.
- The **Supabase store implementation** is type-checked and its SQL is tested on PostgreSQL, but it has **not been run against a live Supabase project** from this environment. Run the checklist in `DEPLOYMENT.md §5` after setup.
- Site search is a simple server-side text match. Enough for dozens of pages; revisit at hundreds.

## 5. Performance

Measured with Lighthouse 12 (mobile, simulated slow 4G) on the production build:

| Page | Performance | Accessibility | Best practices | SEO | LCP | CLS |
|---|---|---|---|---|---|---|
| Home | 89 to 94 | 99 | 100 | 100 | 3.0 to 3.8 s | 0 |
| Fold File (Monkey King) | 89 to 94 | 100 | 100 | 100 | 3.0 to 3.7 s | 0 |
| Paper Shop | 92 | 100 | 100 | 100 | 3.4 s | 0 |
| Learn article | 91 | 100 | 100 | 100 | 3.4 s | 0 |

The **2.5 s LCP target is not yet met** under this very conservative lab throttle (Lighthouse's model is slower than typical Indian 4G). What was done: CSS inlined (no render-blocking requests), fonts preloaded with metric-matched fallbacks, lighter font files, hero images preloaded with high priority, AVIF/WebP responsive variants. Next steps if real-user data (Vercel Speed Insights) shows LCP above 2.5 s: serve the hero at a lower quality, or use `font-display: optional` for the serif. Both cost some visual quality, so they were not applied blindly.

## 6. Final self-critique

- *Could this be a template with a new logo?* The mount-and-wall system, edge rail, crease rules, Fold File layers and Paper Atlas are specific to sculpture and paper; removing them would leave a different site.
- *Is the Paper Atlas easier than a generic store?* Size, colour, quantity, minimum and subtotal are on one panel, the true-scale board answers "how big is it really", and the order sheet is one step. Keyboard-tested.
- *With all animation off, is it still distinctive?* Yes: the composition, typography and mounts carry it.
- *Weak spots*: several artworks still lack years, materials and stories, so their Fold Files are thin; the Studio projects have no photos (they were in the old Supabase storage, which this environment could not reach); the Learn library has two lessons. These are content gaps, listed in `OWNER_CHECKLIST.md`, and the templates are ready for them.
