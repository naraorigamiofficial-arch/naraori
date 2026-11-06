# Nara Origami: naraori.in

The website of origami artist **Abhijeet S. Vashistha** (Nara Origami) and his paper studio **Nara Origami Originals**.

- Artwork archive ("The Fold Files"), studio projects, learning library, journal
- The Paper Atlas: a paper catalogue with order requests (no online payment), stored in Supabase, emailed with Resend
- A private studio dashboard at `/studio`

Built with Next.js 16 (App Router), TypeScript, Zod, Supabase and Resend.

## Quick start

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:3000. In development, order requests are saved to `.data/store.json` and emails are written to `.data/mail/` so you can read them, so nothing needs to be configured.

## Checks

```bash
npm run check
```

```bash
npm run build && npm run test:e2e
```

```bash
npm run test:db
```

`check` runs type checking, linting and unit tests. `test:e2e` runs the browser tests against a production build. `test:db` applies the Supabase migration to a local PostgreSQL and verifies the permission rules.

## Documents

| File | What it covers |
|---|---|
| [OWNER_GUIDE.md](OWNER_GUIDE.md) | Plain-English guide: adding artworks, articles, changing prices, handling orders |
| [OWNER_CHECKLIST.md](OWNER_CHECKLIST.md) | Facts, photographs and decisions still needed from the artist |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Supabase, Resend, Vercel and domain setup, step by step |
| [PROJECT_DECISIONS.md](PROJECT_DECISIONS.md) | Architecture and design decisions, with trade-offs |
| [SEO_IMPLEMENTATION.md](SEO_IMPLEMENTATION.md) | Identity, metadata, structured data, sitemap, redirects, Search Console |
| [.env.example](.env.example) | Every environment variable, explained |
