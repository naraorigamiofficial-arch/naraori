# Deployment

The site needs a host that runs Next.js server code (for order requests and the studio dashboard), so it moves from GitHub Pages to **Vercel**. Nothing below has been done yet: no DNS, credentials or production services were changed while building.

Order of work: **1 Supabase, 2 Resend, 3 Vercel, 4 test on the Vercel address, 5 move the domain.** The live site keeps working on GitHub Pages until step 5.

## 1. Supabase (database)

1. Create a **new** project at https://supabase.com/dashboard (region: Mumbai `ap-south-1` is closest to most customers). Keep the old "naraori" workspace project untouched.
2. Open *SQL Editor*, paste the whole of `supabase/migrations/20261106000000_order_requests.sql`, and run it once.
   - Or with the Supabase CLI: `supabase link --project-ref <ref>` then `supabase db push`.
3. *Project Settings > API Keys*: copy the **Project URL** and a **secret key** (`sb_secret_…`). The secret key is a password to your customer data: it goes only into Vercel's environment variables, never into code, chat or email.
4. Optional check: *Database > Advisors > Security* should show no warnings for the new tables.

## 2. Resend (email)

1. Create an account at https://resend.com and add the domain **naraori.in** under *Domains*.
2. Add the DNS records Resend shows (SPF, DKIM, and the recommended DMARC) at your domain registrar. Wait until Resend shows the domain as *Verified*.
3. Decide the addresses (they are configuration, not code):
   - `EMAIL_FROM`, e.g. `Nara Origami Originals <studio@naraori.in>`. Use a mailbox that exists and that you read: customers will reply to it. Avoid "no-reply".
   - `STUDIO_NOTIFY_EMAIL`, the inbox that receives new requests (can be `naraorigami.official@gmail.com`).
4. Create an API key with *Sending access* only. That is `RESEND_API_KEY`.

## 3. Vercel (hosting)

1. Sign in at https://vercel.com with GitHub and *Import* the `naraori` repository. Framework: Next.js (detected). No build settings to change.
2. Generate the studio password values on your computer:

```bash
npm run studio:password -- "a long passphrase only you know"
```

3. In *Settings > Environment Variables* add, for **Production** (and Preview if you want previews to take orders, usually not):

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://naraori.in` |
| `SUPABASE_URL` | from step 1 |
| `SUPABASE_SECRET_KEY` | from step 1 |
| `RESEND_API_KEY` | from step 2 |
| `EMAIL_FROM` | from step 2 |
| `STUDIO_NOTIFY_EMAIL` | from step 2 |
| `EMAIL_REPLY_TO` | optional |
| `STUDIO_ADMIN_PASSWORD_HASH` | from the command above |
| `STUDIO_SESSION_SECRET` | from the command above |
| `CRON_SECRET` | any long random string |
| `GOOGLE_SITE_VERIFICATION` | optional, see SEO_IMPLEMENTATION.md |

4. Deploy. `vercel.json` registers a daily job that retries any unsent emails.
5. Enable *Analytics* and *Speed Insights* in the Vercel project (free tier is enough).

## 4. Test on the Vercel address (before touching DNS)

On `https://<project>.vercel.app`:

1. Paper Shop: add a 50 cm sheet in any colour, submit an order request with your own email.
2. You should receive the studio email and the customer email; replying to the customer email should go to `EMAIL_FROM`/`EMAIL_REPLY_TO`.
3. In Supabase *Table Editor*, `order_requests` has one row with status `requested`; `notification_outbox` shows two rows `sent`.
4. Go to `/studio`, sign in, open the request, change its status, add a note, export CSV.
5. Change the 70 cm price in *Catalogue & prices*, reload `/shop/double-tissue-70cm` after a minute: the new price shows. Change it back.
6. Send a test enquiry from `/commissions`.
7. Delete the test rows in Supabase if you like (delete from `order_requests`; items, history and outbox rows go with it).

If emails fail, the requests still appear in `/studio` with the error and a Retry button.

## 5. Move the domain

1. In Vercel *Settings > Domains*, add `naraori.in` and `www.naraori.in` (set `www` to redirect to the bare domain). Vercel shows the DNS records to set.
2. At your registrar, change the records to the values Vercel shows (this replaces the GitHub Pages records).
3. In the GitHub repository settings, turn off GitHub Pages after the switch. The `CNAME` file in the repository is only used by GitHub Pages and can then be deleted.
4. If you own `naraori.com` or `naraorigamioriginals.com`, add them in Vercel as redirects to `https://naraori.in`.
5. Follow the Search Console steps in `SEO_IMPLEMENTATION.md §7`.

## Local development

```bash
npm install
```

```bash
npm run dev
```

No configuration is needed: requests go to `.data/store.json` and emails to `.data/mail/*.html`. To try the studio locally, put `STUDIO_ADMIN_PASSWORD_HASH` and `STUDIO_SESSION_SECRET` in `.env.local`.

## Updating dependencies

Versions are pinned in `package-lock.json`. Before upgrading Next.js, read `node_modules/next/dist/docs/01-app/02-guides/upgrading/` for the target version, then run `npm run check`, `npm run build` and `npm run test:e2e`.
