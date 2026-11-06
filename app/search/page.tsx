import type { Metadata } from "next";
import Link from "next/link";
import "@/styles/pages.css";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Folio } from "@/components/Folio";
import { publishedArtworks } from "@/content/artworks";
import { products } from "@/content/catalogue";
import { publishedProjects } from "@/content/projects";
import { getJournal, getLearn } from "@/lib/content";

export const metadata: Metadata = { title: "Search", robots: { index: false, follow: true }, alternates: { canonical: "/search" } };

export default async function SearchPage(props: PageProps<"/search">) {
  const sp = await props.searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 80);
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const hit = (...fields: (string | null | undefined)[]) => {
    const hay = fields.join(" ").toLowerCase();
    return terms.length > 0 && terms.every((t) => hay.includes(t));
  };
  const [learn, journal] = await Promise.all([getLearn(), getJournal()]);
  const results = !terms.length
    ? []
    : [
        ...publishedArtworks().filter((a) => hit(a.title, a.alternateTitle, a.subject, a.intro, a.category, ...a.story.flatMap((s) => s.body))).map((a) => ({ kind: "Artwork", href: `/artworks/${a.slug}`, title: a.title, text: a.intro })),
        ...publishedProjects().filter((p) => hit(p.title, ...p.summary, ...p.tags, ...p.sections.flatMap((s) => s.body))).map((p) => ({ kind: "Studio project", href: `/projects/${p.slug}`, title: p.title, text: p.summary[0].slice(0, 160) + "…" })),
        ...learn.filter((d) => hit(d.frontmatter.title, d.frontmatter.description, d.html.replace(/<[^>]+>/g, " "))).map((d) => ({ kind: "Learn", href: `/learn/${d.slug}`, title: d.frontmatter.title, text: d.frontmatter.description })),
        ...journal.filter((d) => hit(d.frontmatter.title, d.frontmatter.description, d.html)).map((d) => ({ kind: "Journal", href: `/journal/${d.slug}`, title: d.frontmatter.title, text: d.frontmatter.description })),
        ...products.filter((p) => p.published && hit(p.name, p.summary, p.sizeLabel, p.construction, ...p.applications)).map((p) => ({ kind: "Paper", href: `/shop/${p.slug}`, title: p.name, text: p.summary })),
      ];
  return (
    <Folio>
      <Breadcrumbs items={[{ name: "Search", path: "/search" }]} />
      <div className="frame section-tight">
        <h1 className="title-2">Search</h1>
        <form role="search" action="/search" method="get" style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", maxWidth: "40rem" }}>
          <label htmlFor="q" className="visually-hidden">Search artworks, lessons and paper</label>
          <input id="q" name="q" type="search" className="input" defaultValue={q} placeholder="e.g. Rama, grid, 100 cm" />
          <button className="btn" type="submit">Search</button>
        </form>
        {terms.length > 0 && (
          <>
            <p className="meta" role="status" style={{ marginTop: "1.5rem" }}>{results.length} result{results.length === 1 ? "" : "s"} for “{q}”</p>
            <ul className="search-results">
              {results.map((r) => (
                <li key={r.href}><Link href={r.href}><span className="mono">{r.kind}</span><b>{r.title}</b><span className="muted">{r.text}</span></Link></li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Folio>
  );
}
