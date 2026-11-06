import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "@/styles/editorial.css";
import { ArtworkMount } from "@/components/ArtworkMount";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Folio } from "@/components/Folio";
import { GridCalculator } from "@/components/GridCalculator";
import { JsonLd } from "@/components/JsonLd";
import { getArtwork } from "@/content/artworks";
import { products } from "@/content/catalogue";
import { identity } from "@/content/identity";
import { getLearn } from "@/lib/content";
import { fmtDate } from "@/lib/format";
import { articleLd, graph, pageMetadata } from "@/lib/seo";

export const dynamicParams = false;
export async function generateStaticParams() {
  return (await getLearn()).map((d) => ({ slug: d.slug }));
}
async function find(slug: string) {
  return (await getLearn()).find((d) => d.slug === slug);
}
export async function generateMetadata(props: PageProps<"/learn/[slug]">): Promise<Metadata> {
  const d = await find((await props.params).slug);
  if (!d) return {};
  const f = d.frontmatter;
  return pageMetadata({ title: f.title, description: f.description, path: `/learn/${d.slug}`, type: "article", publishedTime: f.published, modifiedTime: f.updated });
}

export default async function LearnArticle(props: PageProps<"/learn/[slug]">) {
  const d = await find((await props.params).slug);
  if (!d) notFound();
  const f = d.frontmatter;
  const all = await getLearn();
  const relatedDocs = all.filter((x) => f.relatedArticles?.includes(x.slug));
  const relatedArt = (f.relatedArtworks ?? []).map(getArtwork).filter((a) => !!a);
  const relatedProducts = products.filter((p) => p.published && f.relatedProducts?.includes(p.slug));
  // Split the body so the calculator sits under the "Try it" heading.
  const [before, after] = f.calculator ? d.html.split(/(?=<h2 id="exercises")/) : [d.html, ""];

  return (
    <Folio>
      <Breadcrumbs items={[{ name: "Learn", path: "/learn" }, { name: f.section, path: "/learn" }, { name: f.title, path: `/learn/${d.slug}` }]} />
      <article className="frame reading">
        <header className="reading-head">
          <span className="eyebrow">{f.section}</span>
          <h1 className="title-1">{f.title}</h1>
          <p className="lede">{f.description}</p>
          <dl className="article-facts">
            <div><dt>Author</dt><dd><Link href="/about">{identity.person.name}</Link></dd></div>
            <div><dt>Level</dt><dd>{f.difficulty}</dd></div>
            <div><dt>Prerequisites</dt><dd>{f.prerequisites.length ? f.prerequisites.join(", ") : "None"}</dd></div>
            <div><dt>Reading time</dt><dd>{d.readingMinutes} min</dd></div>
            <div><dt>Published</dt><dd><time dateTime={f.published}>{fmtDate(f.published)}</time></dd></div>
            {f.updated && f.updated !== f.published && <div><dt>Revised</dt><dd><time dateTime={f.updated}>{fmtDate(f.updated)}</time></dd></div>}
          </dl>
        </header>
        <div className="reading-grid">
          <div>
            <div className="prose" dangerouslySetInnerHTML={{ __html: before }} />
            {f.calculator && <GridCalculator />}
            {after && <div className="prose" dangerouslySetInnerHTML={{ __html: after }} />}
          </div>
          <aside className="reading-aside">
            {d.toc.length > 2 && (
              <nav className="toc" aria-label="On this page">
                <h2 className="eyebrow">On this page</h2>
                <ol>{d.toc.map((t) => <li key={t.id}><a href={`#${t.id}`}>{t.text}</a></li>)}</ol>
              </nav>
            )}
          </aside>
        </div>
        {(relatedArt.length > 0 || relatedDocs.length > 0 || relatedProducts.length > 0) && (
          <section className="connected" aria-labelledby="connected-title">
            <header className="section-head">
              <span className="index">Connected</span>
              <h2 id="connected-title" className="title-3">See it in practice</h2>
            </header>
            {relatedArt.length > 0 && (
              <ul className="connected-art">
                {relatedArt.map((a) => (
                  <li key={a.slug}>
                    <ArtworkMount artwork={a} aspect="1 / 1" sizes="(min-width: 900px) 22vw, 50vw" caption="none" />
                    <Link href={`/artworks/${a.slug}`}><b>{a.title}</b> <span className="muted">{a.intro}</span></Link>
                  </li>
                ))}
              </ul>
            )}
            <ul className="related-plain">
              {relatedDocs.map((r) => <li key={r.slug}><span className="mono">Lesson</span> <Link href={`/learn/${r.slug}`}>{r.frontmatter.title}</Link></li>)}
              {relatedProducts.map((p) => <li key={p.slug}><span className="mono">Material</span> <Link href={`/shop/${p.slug}`}>{p.name}</Link></li>)}
            </ul>
          </section>
        )}
      </article>
      <JsonLd data={graph(articleLd({ title: f.title, description: f.description, path: `/learn/${d.slug}`, published: f.published, updated: f.updated }))} />
    </Folio>
  );
}
