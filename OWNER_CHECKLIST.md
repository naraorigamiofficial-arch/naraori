# What the site still needs from you

Nothing below was invented. Where a fact was missing, the site says "Not yet documented" or keeps the page as a draft. Each answer can go straight into the file named.

## Decisions (please confirm)

- [ ] **Prices.** Your brief gives 50 cm ₹259/sheet (minimum 5), 70 cm ₹389 (minimum 2), 100 cm ₹999 (minimum 2), 150 cm+ by enquiry. The old catalogue used pack prices (e.g. 50 cm: 5 sheets ₹1,500; 150 cm: ₹3,500/sheet). **The site uses the brief's prices** for 50/70/100 cm, 150 cm+ by enquiry, and the old pack prices for 10 to 37.5 cm. Correct? (`content/catalogue.ts`, or the studio dashboard)
- [ ] **Colours.** The old homepage listed Red, Black, White; the newer catalogue listed six (also Blue, Yellow, Green). The site offers all six for every size. Which are really available, per size?
- [ ] **Shipping.** From the old site: India ₹140, free above ₹2,000; international US$30, free above US$200. The site shows these as *estimates* (and does not promise free international shipping). Still right?
- [ ] **Lead times.** "Large custom or gridded sheets: at least one month" is from the old catalogue. Typical time for standard sizes?
- [ ] **"Pioneering" wording.** The site says "A pioneering independent studio making large-format, treated double-tissue paper accessible to origami artists in India." If you have evidence for "first in India", send it and we can strengthen this.
- [ ] **Ordering terms** (`app/terms/page.tsx`), especially the 7-day window for damaged deliveries. Please read and adjust; consider a quick check by someone who knows Indian consumer law.
- [ ] **Your title at SIOA.** The site uses your own words: "administrator and developer". Is "founder" also correct?

## Facts about the artworks (`content/artworks.ts`)

| Work | Missing |
|---|---|
| The Monkey King (Sun Wukong) | Year; finished height; confirm the six process photos are of this sculpture; "double tracing" or "double tissue" paper? |
| Maryada Purushottam (Lord Rama) | Year; paper type and colour; finished size; your notes on the subject |
| The Monk of Fire (Agniv), 2025 | The photo looks copper-toned but the caption says "black DT": treated or painted? A larger photo (current file is only 1080 px); the character's story |
| Sunstriker | Year; paper; finished size |
| *Draft:* beetle study (`KB.webp`) | Title and everything else (it was in the old repo without any description) |
| *Draft:* Chhatrapati Shivaji Maharaj, version 1 | Photograph; year; sheet size and grid |
| *Draft:* Maharana Pratap | Photograph and all details |

For every work, if you can: whether cuts, glue or MC were used, your design method, ownership/availability, and any exhibitions or publications it appeared in (with dates and a link or scan as proof).

## Photographs

- [x] **Homepage turntable video**: confirmed as the Chhatrapati Shivaji Maharaj re-design; the homepage label links to that project.

- [ ] **Studio project photos.** Your earlier workspace had photos for Instinct vs Honour, Shivaji re-design (cover and the collapsed horse) and Vajrabhairava. They are in the old Supabase storage, which could not be reached from the build environment. Download and send them (or upload to `public/media/studio/`).
- [ ] Detail shots and other angles of each finished sculpture (the Fold File pages support several images).
- [ ] Real **product photos** of the paper: sheets, a stack, a roll, each colour. The shop currently uses drawn diagrams and colour chips only.
- [ ] **Photographer credit** for each photo, if not taken by you.
- [ ] The crease pattern `crease-pattern.png`: which model is it, and may it be published?

## Profiles and links (`content/identity.ts`)

- [ ] Official Instagram, YouTube, Facebook or other profile URLs.
- [ ] The SIOA website address.
- [ ] Do you own `naraori.com` and/or `naraorigamioriginals.com`? (They will be redirected to naraori.in.)
- [ ] Should the older name "Shang Nara" appear? If yes, connected to which works or profiles?

## Biography and press (`app/about/page.tsx`, `app/press/page.tsx`)

- [ ] Approve the short biography on the press page.
- [ ] Verified interviews, publications, talks, exhibitions, workshops, awards (each with a date and a source).
- [ ] Milestones: when you started folding, first original design, when Nara Origami Originals began.
- [ ] Image usage terms for press (currently: "please ask before publishing, credit as shown").

## Technical (one-time, see DEPLOYMENT.md)

- [ ] Create the new Supabase project and run the migration.
- [ ] Verify naraori.in in Resend and choose the sender and studio inbox addresses.
- [ ] Import the repository into Vercel and add the environment variables.
- [ ] Choose a studio dashboard passphrase.
- [ ] Move DNS from GitHub Pages to Vercel.
- [ ] Set up Google Search Console.

## Content to write when you're ready

- "What is double-tissue paper?" (a draft exists in `content/learn/`, unpublished, waiting for your facts on how you make and treat it)
- Box pleating, from your practice
- Regular journal entries from the folding table
