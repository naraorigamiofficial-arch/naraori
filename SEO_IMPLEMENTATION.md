# SEO implementation

## 1. Legacy audit (previous static site)

| Item | What existed | Problem | Now |
|---|---|---|---|
| Title | "Nara Origami Originals" on the homepage; "Nara  Sized Different" on the catalog | One generic title, typo in the catalog | Unique title per page, template `Page | Nara Origami` |
| Description | None | Nothing for search snippets | Written per page from real content |
| Canonical | None | | Every page, via `alternates.canonical` |
| Open Graph / social | None | | Per page, artwork photo as image |
| Structured data | None | Search engines could not connect the person, the name and the studio | Person, Organization, WebSite, VisualArtwork, Article, Product, BreadcrumbList |
| robots.txt / sitemap | None | | Generated, published pages only |
| Headings | Several `h1`-like display headings, gallery titles as `h3` | | One `h1` per page, ordered headings (tested) |
| Image alt text | "Step 1" … "Step 6", "Origami warrior sculpture" for two different works | Not descriptive | Every image described |
| URLs | One page with `#anchors`; `/Catalog/catalog.html` | No page per artwork | A permanent page per artwork, article, project and product |
| Footer | Displayed "naraori.com" but linked naraori.in | Mixed identity | One canonical domain from `content/identity.ts` |

## 2. Canonical identity

All names come from `content/identity.ts`. Nothing else hard-codes them.

| Entity | Name | JSON-LD `@id` |
|---|---|---|
| The person | **Abhijeet S. Vashistha** (alternate: Nara Origami, Abhijeet Vashistha, Nara) | `https://naraori.in/#person` |
| The studio / business | **Nara Origami Originals** | `https://naraori.in/#studio` |
| The website | **Nara Origami** | `https://naraori.in/#website` |
| SIOA (separate organisation) | Society of Indian Origami Artists | `https://naraori.in/#sioa`, linked as `memberOf` |

- "Shang Nara" is stored but **not published** until the owner confirms which works it connects to.
- `sameAs` (official profiles) is **empty** until the owner supplies verified URLs. Add them to `identity.profiles` and they appear on /about and in every Person block.
- The SIOA website URL is **not linked** until confirmed (`identity.sioa.url`).
- /about is the authoritative profile page (`ProfilePage` with `mainEntity` = the Person). Artwork pages, lessons and journal entries all name the same Person as creator/author.

## 3. Page metadata

Built by `pageMetadata()` in `lib/seo.ts`: title, description, canonical, Open Graph, Twitter card. Examples:

| URL | Title |
|---|---|
| `/` | Nara Origami \| Origami sculpture by Abhijeet S. Vashistha |
| `/artworks/sun-wukong-the-monkey-king` | The Monkey King (Sun Wukong): origami sculpture \| Nara Origami |
| `/shop` | Paper Shop: treated double-tissue origami paper, India \| Nara Origami |
| `/shop/double-tissue-100cm` | Treated double-tissue paper, 100 cm: origami paper \| Nara Origami |
| `/learn/grids-and-sheet-size` | Grids and sheet size: how big is one square? \| Nara Origami |
| `/about` | About Abhijeet S. Vashistha, Indian origami artist \| Nara Origami |

**Not indexed**: `/order-request`, `/order-request/confirmation/*`, `/search`, `/studio/*`, `/api/*` (meta robots and/or `X-Robots-Tag` and robots.txt). Archive filters (`/artworks?category=…`, `?view=index`) carry the canonical `/artworks`, so they never compete with it. Preview deployments on Vercel serve `Disallow: /` automatically.

## 4. Structured data

| Page | Types |
|---|---|
| Every page | WebSite, Person, Organization (studio), Organization (SIOA) |
| Breadcrumbs | BreadcrumbList |
| Artwork | VisualArtwork (creator, artform, medium, surface, date only when known, ImageObject with copyright holder) |
| Learn | Article (author = Person, publisher = studio, published and revised dates) |
| Journal, Studio project | BlogPosting |
| Paper (fixed price) | Product with AggregateOffer in INR, availability MadeToOrder |
| About | ProfilePage |

Deliberately **not** included: ratings, reviews, awards, or merchant shipping/return markup. Purchases are manual requests, not a checkout, so the site does not claim eligibility for Google's merchant listing features. Not every type above produces a rich result; they exist so the entities are understood.

Validate after launch: https://search.google.com/test/rich-results and https://validator.schema.org

## 5. Sitemap and robots

- `/sitemap.xml` lists static pages, published artworks (with image entries), projects, products, lessons and journal entries. `lastModified` is given only where a real date is known (articles and journal entries); no fake "updated today" dates.
- `/robots.txt` allows everything except studio, API, confirmations and search, and points to the sitemap.

## 6. Redirects (old to new)

Configured in `next.config.ts` as permanent (308) redirects:

| Old URL | New URL |
|---|---|
| `/index.html` | `/` |
| `/Catalog/catalog.html`, `/Catalog`, `/catalog`, `/papers` | `/shop` |
| `/gallery` | `/artworks` |
| `/imgs/ram.webp` | `/media/artworks/maryada-purushottam.webp` |
| `/imgs/AG.webp` | `/media/artworks/agniv-the-monk-of-fire.webp` |
| `/imgs/hr.webp` | `/media/artworks/sunstriker.webp` |
| `/imgs/wkkk.webp` | `/media/artworks/sun-wukong-the-monkey-king.webp` |
| `/imgs/me.webp` | `/media/studio/abhijeet-s-vashistha-portrait.webp` |
| `/imgs/s1.jpg` … `/imgs/s6.jpg` | `/media/process/sun-wukong-step-1.jpg` … `-6.jpg` |

Old in-page anchors (`/#showcase`, `/#papers`, `/#about`) cannot be redirected by a server (browsers never send the part after `#`); they land on the new homepage, which links to all three sections at the top.

**Other domains** (only if the owner controls them; do not assume): the old footer displayed `naraori.com`, and the brief mentions `naraorigamioriginals.com`. If either is owned, add it to the Vercel project and set it to redirect permanently to `https://naraori.in`, preserving the path. Vercel does this from the Domains screen.

## 7. After launch: Search Console checklist

1. Add the property `naraori.in` (Domain property, verified by DNS TXT record) at https://search.google.com/search-console. Or use the HTML tag method: put the code in `GOOGLE_SITE_VERIFICATION`.
2. Submit `https://naraori.in/sitemap.xml` under *Sitemaps*.
3. Use *URL Inspection* on `/`, `/about`, `/artworks/sun-wukong-the-monkey-king`, `/shop` and request indexing.
4. Check *Pages* after one to two weeks: everything in the sitemap should be indexed; `/studio` and `/order-request` should show as excluded by noindex (that is correct).
5. Check *Enhancements* for breadcrumb and product warnings.
6. Add the same site to Bing Webmaster Tools (it can import from Search Console).

## 8. Measurement

- **Analytics**: enable Vercel Web Analytics and Speed Insights in the Vercel dashboard (privacy-friendly, no cookie banner required) for real-user Core Web Vitals. If Google Analytics is preferred, add it later with a consent notice.
- **Conversions to watch**: order request submitted (`POST /api/order-requests` 201), enquiry sent (`POST /api/enquiries` 201). Both are counted in the studio dashboard too.
- **Search queries to track** in Search Console: the artist's name and variants, "Nara Origami", artwork titles, "double tissue paper India", "large origami paper", "origami grid size".
- **Baseline**: none exists yet (the old site had no analytics). Record the first 28 days after launch as the baseline; do not compare against invented numbers.

## 9. Content opportunities

Real, original pages that answer real searches. Each needs the artist's own knowledge; none should be written as filler:

- What is double-tissue paper? (a draft placeholder exists, unpublished, waiting for the artist's facts)
- Understanding box pleating, from the artist's practice
- A Fold File for every finished sculpture, with year, paper and story
- Design study: Vajrabhairava, 34 hands on one sheet (as the project progresses)
- Origami design in India and the work of SIOA (with SIOA's approval)
