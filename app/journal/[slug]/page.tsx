import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "@/styles/editorial.css";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Folio } from "@/components/Folio";
import { JsonLd } from "@/components/JsonLd";
import { identity } from "@/content/identity";
import { getProject } from "@/content/projects";
import { getJournal } from "@/lib/content";
import { fmtDate } from "@/lib/format";
import { articleLd, graph, pageMetadata } from "@/lib/seo";

export const dynamicParams = false;
export async function generateStaticParams() {
  return (await getJournal()).map((d) => ({ slug: d.slug }));
}
async function find(slug: string) {
  return (await getJournal()).find((d) => d.slug === slug);
}
export async function generateMetadata(props: PageProps<"/journal/[slug]">): Promise<Metadata> {
  const d = await find((await props.params).slug);
  if (!d) return {};
  return pageMetadata({ title: d.frontmatter.title, description: d.frontmatter.description, path: `/journal/${d.slug}`, type: "article", publishedTime: d.frontmatter.date });
}

export default async function JournalEntry(props: PageProps<"/journal/[slug]">) {
  const d = await find((await props.params).slug);
  if (!d) notFound();
  const project = d.frontmatter.project ? getProject(d.frontmatter.project) : null;
  const all = await getJournal();
  const i = all.findIndex((x) => x.slug === d.slug);
  const newer = all[i - 1];
  const older = all[i + 1];
  return (
    <Folio>
      <Breadcrumbs items={[{ name: "Journal", path: "/journal" }, { name: d.frontmatter.title, path: `/journal/${d.slug}` }]} />
      <article className="frame reading">
        <header className="reading-head">
          <span className="eyebrow"><time dateTime={d.frontmatter.date}>{fmtDate(d.frontmatter.date)}</time></span>
          <h1 className="title-1">{d.frontmatter.title}</h1>
          <p className="meta">{identity.person.name}{project && <> · <Link href={`/projects/${project.slug}`}>{project.title}</Link></>}</p>
        </header>
        <div className="prose journal-body" dangerouslySetInnerHTML={{ __html: d.html }} />
        <nav className="pager" aria-label="More entries">
          {older ? <Link href={`/journal/${older.slug}`}>← {older.frontmatter.title}</Link> : <span />}
          {newer ? <Link href={`/journal/${newer.slug}`}>{newer.frontmatter.title} →</Link> : <span />}
        </nav>
      </article>
      <JsonLd data={graph(articleLd({ title: d.frontmatter.title, description: d.frontmatter.description, path: `/journal/${d.slug}`, published: d.frontmatter.date, type: "BlogPosting" }))} />
    </Folio>
  );
}
