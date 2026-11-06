import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import "@/styles/archive.css";
import { ArtworkMount } from "@/components/ArtworkMount";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Folio } from "@/components/Folio";
import { JsonLd } from "@/components/JsonLd";
import { getArtwork, publishedArtworks } from "@/content/artworks";
import { identity } from "@/content/identity";
import { getProject } from "@/content/projects";
import { getLearn } from "@/lib/content";
import { artworkLd, graph, pageMetadata } from "@/lib/seo";

export const dynamicParams = false;
export function generateStaticParams() {
  return publishedArtworks().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata(props: PageProps<"/artworks/[slug]">): Promise<Metadata> {
  const a = getArtwork((await props.params).slug);
  if (!a) return {};
  const name = a.alternateTitle ? `${a.title} (${a.alternateTitle})` : a.title;
  return pageMetadata({
    title: `${name}: origami sculpture`,
    description: `${name}, an original origami sculpture by ${identity.person.name}${a.technical.sheetSize ? `, folded from a single ${a.technical.sheetSize} sheet` : ""}${a.technical.grid ? ` on a ${a.technical.grid}` : ""}. ${a.subject}.`,
    path: `/artworks/${a.slug}`,
    image: a.image ? { url: a.image.src, width: a.image.width, height: a.image.height, alt: a.image.alt } : undefined,
  });
}

const LAYER_ORDER = ["sculpture", "concept", "prototypes", "structure", "materials"] as const;

export default async function ArtworkPage(props: PageProps<"/artworks/[slug]">) {
  const a = getArtwork((await props.params).slug);
  if (!a) notFound();
  const learn = await getLearn();
  const related = learn.filter((d) => a.relatedArticles?.includes(d.slug));
  const projects = (a.relatedProjects ?? []).map(getProject).filter((p) => !!p);
  const others = publishedArtworks().filter((x) => x.slug !== a.slug);
  const t = a.technical;
  const spec: [string, string | number | null][] = [
    ["Artist", identity.person.name],
    ["Year", a.year],
    ["Subject", a.subject],
    ["Sheet", t.sheetShape && t.sheetSize ? `${t.sheetShape}, ${t.sheetSize}` : (t.sheetSize ?? t.sheetShape)],
    ["Number of sheets", t.sheets === 1 ? "One" : t.sheets],
    ["Grid", t.grid],
    ["Paper", t.paper],
    ["Cuts, glue or treatments", t.cutsOrGlue],
    ["Finished size", t.finishedSize],
    ["Design method", t.method],
    ["Status", a.availability],
  ];
  const layers = LAYER_ORDER.map((k) => a.story.find((s) => s.key === k)).filter((s) => !!s);

  return (
    <Folio>
      <Breadcrumbs items={[{ name: "Artwork", path: "/artworks" }, { name: a.title, path: `/artworks/${a.slug}` }]} />
      <article className="foldfile">
        <header className="frame ff-head">
          <div className="ff-title">
            <span className="eyebrow">
              Fold File · {a.catalogueNo}
              {a.year ? ` · ${a.year}` : ""}
            </span>
            <h1 className="title-1">{a.title}</h1>
            {a.alternateTitle && <p className="ff-alt">{a.alternateTitle}</p>}
            <p className="ff-intro">{a.intro}</p>
            <p className="meta">By {identity.person.name} · {identity.artistName}</p>
          </div>
          <figure className="ff-plate">
            <ArtworkMount artwork={a} aspect="1 / 1" sizes="(min-width: 900px) 62vw, 100vw" priority action="zoom" />
            <figcaption className="meta">
              {a.image ? (<>{a.image.alt}. Select the image to view it full screen.{a.image.credit ? ` Photograph: ${a.image.credit}.` : ""}</>) : "Artwork photograph required."}
            </figcaption>
          </figure>
        </header>

        <div className="frame ff-body">
          <section aria-labelledby="spec-title" className="ff-spec">
            <h2 id="spec-title" className="eyebrow">Specification</h2>
            <dl className="ledger">
              {spec.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd className={v === null || v === undefined ? "unknown" : undefined}>{v ?? "Not yet documented"}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="story-title" className="ff-story">
            <h2 id="story-title" className="title-3">Unfold the story</h2>
            <p className="muted">From the finished sculpture back towards the paper it began as. Open each layer in turn, or read them all: nothing is hidden from the page.</p>
            <ol className="layers">
              {layers.map((l, i) => (
                <li key={l.key}>
                  <details className="layer" open={i === 0}>
                    <summary>
                      <span className="mono">Layer {String(i + 1).padStart(2, "0")}</span>
                      <span className="layer-title">{l.title}</span>
                    </summary>
                    <div className="layer-body">
                      {l.body.map((p, j) => (
                        <p key={j}>{p}</p>
                      ))}
                    </div>
                  </details>
                </li>
              ))}
            </ol>
            {layers.length < 3 && (
              <p className="meta">The concept, prototypes and structural studies for this work have not been documented yet.</p>
            )}
          </section>
        </div>

        {a.process && (
          <section className="frame section" aria-labelledby="process-title">
            <header className="section-head">
              <span className="index">Development</span>
              <h2 id="process-title" className="title-2">From sheet to sculpture</h2>
            </header>
            <ol className="process-list">
              {a.process.map((p, i) => (
                <li key={p.image.src}>
                  <figure>
                    <a href={p.image.src} data-zoom className="zoomable" aria-label={`Open photograph: ${p.title}`}>
                      <Image src={p.image.src} alt={p.image.alt} width={p.image.width} height={p.image.height} sizes="(min-width: 900px) 30vw, 90vw" quality={70} />
                    </a>
                    <figcaption>
                      <span className="mono">Stage {String(i + 1).padStart(2, "0")}</span>
                      <b>{p.title}</b>
                      <span>{p.note}</span>
                      <span className="muted">{p.detail}</span>
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ol>
          </section>
        )}

        {(related.length > 0 || projects.length > 0) && (
          <section className="frame section-tight" aria-labelledby="related-title">
            <header className="section-head">
              <span className="index">Connected</span>
              <h2 id="related-title" className="title-3">Read further</h2>
            </header>
            <ul className="related-list">
              {related.map((d) => (
                <li key={d.slug}>
                  <Link href={`/learn/${d.slug}`}><span className="mono">Learn · {d.frontmatter.section}</span><b>{d.frontmatter.title}</b></Link>
                </li>
              ))}
              {projects.map((p) => (
                <li key={p.slug}>
                  <Link href={`/projects/${p.slug}`}><span className="mono">In the studio · {p.status}</span><b>{p.title}</b></Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="frame section-tight">
          <div className="ff-enquire">
            <p className="lede" style={{ margin: 0 }}>Interested in this work, or in a commission of similar ambition?</p>
            <Link className="btn" href={`/commissions?about=${encodeURIComponent(a.title)}`}>Enquire</Link>
          </div>
        </section>

        <nav className="frame section-tight" aria-label="Other works">
          <span className="eyebrow">Elsewhere in the archive</span>
          <ul className="others">
            {others.map((o) => (
              <li key={o.slug}>
                <Link href={`/artworks/${o.slug}`}><span className="mono">{o.catalogueNo}</span> {o.title}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </article>
      <JsonLd data={graph(artworkLd(a))} />
    </Folio>
  );
}
