import Link from "next/link";
import "@/styles/archive.css";
import { ArchivalCaption } from "@/components/ArchivalCaption";
import { ArtworkMount } from "@/components/ArtworkMount";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Folio } from "@/components/Folio";
import { publishedArtworks } from "@/content/artworks";
import { identity } from "@/content/identity";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Artwork archive: original origami sculptures",
  description: `The Fold Files: every original origami sculpture by ${identity.person.name}, with sheet size, grid, paper and the story of each design.`,
  path: "/artworks",
});

const ASPECTS = ["4 / 5", "1 / 1", "5 / 4", "4 / 5"];

export default async function ArtworksPage(props: PageProps<"/artworks">) {
  const sp = await props.searchParams;
  const view = sp.view === "index" ? "index" : "exhibition";
  const category = typeof sp.category === "string" ? sp.category : null;
  const all = publishedArtworks().sort((a, b) => a.catalogueNo.localeCompare(b.catalogueNo));
  const categories = [...new Set(all.map((a) => a.category))];
  const works = category ? all.filter((a) => a.category === category) : all;
  const q = (over: Record<string, string | null>) => {
    const p = new URLSearchParams();
    const v = { view: view === "index" ? "index" : null, category, ...over };
    Object.entries(v).forEach(([k, val]) => val && p.set(k, val));
    const s = p.toString();
    return s ? `/artworks?${s}` : "/artworks";
  };

  return (
    <Folio>
      <Breadcrumbs items={[{ name: "Artwork", path: "/artworks" }]} />
      <header className="frame archive-head">
        <span className="eyebrow">The Fold Files</span>
        <h1 className="title-1">Artwork archive</h1>
        <p className="lede">
          Original sculptures by {identity.person.name}. Each entry records how the work was made (the sheet, the grid, the paper) and, where documented, the story behind it.
        </p>
      </header>

      <div className="frame archive-controls">
        <nav aria-label="Filter by subject" className="chip-row">
          <Link href={q({ category: null })} aria-current={!category ? "true" : undefined} className="chip">All ({all.length})</Link>
          {categories.map((c) => (
            <Link key={c} href={q({ category: c })} aria-current={category === c ? "true" : undefined} className="chip">
              {c} ({all.filter((a) => a.category === c).length})
            </Link>
          ))}
        </nav>
        <nav aria-label="Choose view" className="chip-row view-toggle">
          <Link href={q({ view: null })} aria-current={view === "exhibition" ? "true" : undefined} className="chip">Exhibition</Link>
          <Link href={q({ view: "index" })} aria-current={view === "index" ? "true" : undefined} className="chip">Index list</Link>
        </nav>
      </div>

      {view === "exhibition" ? (
        <ol className="frame exhibition" aria-label="Artworks">
          {works.map((a, i) => (
            <li key={a.slug} className={`ex-item ex-${i % 4}`}>
              <ArtworkMount artwork={a} aspect={a.slug === "agniv-the-monk-of-fire" ? "3 / 2" : ASPECTS[i % 4]} fit={a.slug === "agniv-the-monk-of-fire" ? "cover" : "contain"} sizes="(min-width: 900px) 50vw, 100vw" priority={i === 0} />
              <div className="ex-cap">
                <ArchivalCaption artwork={a} as="h2" />
                <Link className="link-arrow" href={`/artworks/${a.slug}`} aria-label={`Open the Fold File for ${a.title}`}>Open the Fold File</Link>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="frame table-scroll" tabIndex={0} role="region" aria-label="Artwork index">
          <table className="index-table">
            <caption className="visually-hidden">Index of artworks with year, subject, sheet and grid</caption>
            <thead>
              <tr><th scope="col">No.</th><th scope="col">Title</th><th scope="col">Year</th><th scope="col">Subject</th><th scope="col">Sheet</th><th scope="col">Grid</th></tr>
            </thead>
            <tbody>
              {works.map((a) => (
                <tr key={a.slug}>
                  <td className="mono">{a.catalogueNo.replace("NO. ", "")}</td>
                  <th scope="row"><Link href={`/artworks/${a.slug}`}>{a.title}</Link>{a.alternateTitle && <span className="muted"> ({a.alternateTitle})</span>}</th>
                  <td>{a.year ?? <span className="muted">Not recorded</span>}</td>
                  <td>{a.category}</td>
                  <td>{a.technical.sheetSize ?? "Not recorded"}</td>
                  <td>{a.technical.grid ?? "Not recorded"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className="frame section">
        <div className="notice">
          <p style={{ margin: 0 }}>
            Works in progress, including the Vajrabhairava mega-project and the Chhatrapati Shivaji Maharaj re-design, are documented <Link href="/projects">in the studio</Link>.
          </p>
        </div>
      </section>
    </Folio>
  );
}
