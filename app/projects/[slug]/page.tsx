import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "@/styles/editorial.css";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Folio } from "@/components/Folio";
import { JsonLd } from "@/components/JsonLd";
import { identity } from "@/content/identity";
import { getProject, publishedProjects } from "@/content/projects";
import { getJournal } from "@/lib/content";
import { fmtDate } from "@/lib/format";
import { articleLd, graph, pageMetadata } from "@/lib/seo";

export const dynamicParams = false;
export const generateStaticParams = () => publishedProjects().map((p) => ({ slug: p.slug }));

export async function generateMetadata(props: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const p = getProject((await props.params).slug);
  if (!p) return {};
  return pageMetadata({ title: `${p.title}: studio project`, description: p.summary[0].slice(0, 155).replace(/\s\S*$/, "") + "…", path: `/projects/${p.slug}`, type: "article" });
}

export default async function ProjectPage(props: PageProps<"/projects/[slug]">) {
  const p = getProject((await props.params).slug);
  if (!p) notFound();
  const updates = (await getJournal()).filter((j) => j.frontmatter.project === p.slug);
  return (
    <Folio>
      <Breadcrumbs items={[{ name: "Studio", path: "/projects" }, { name: p.title, path: `/projects/${p.slug}` }]} />
      <article className="frame reading">
        <header className="reading-head">
          <span className="eyebrow">Studio project · <span className="tag">{p.status}</span></span>
          <h1 className="title-1">{p.title}</h1>
          <p className="meta">
            {identity.person.name}
            {p.startedOn ? ` · started ${fmtDate(p.startedOn)}` : ""} · {p.tags.join(" · ")}
          </p>
        </header>
        <div className="reading-grid">
          <div className="prose">
            {p.summary.map((s, i) => <p key={i} className={i === 0 ? "first" : undefined}>{s}</p>)}
            {p.sections.map((s) => (
              <section key={s.heading}>
                <h2>{s.heading}</h2>
                {s.body.map((b, i) => <p key={i}>{b}</p>)}
              </section>
            ))}
            {!p.image && <div className="placeholder-plate" style={{ marginTop: "2rem" }}>Project photographs to be added</div>}
          </div>
          <aside className="reading-aside">
            <h2 className="eyebrow">Progress log</h2>
            {updates.length ? (
              <ol className="log">
                {updates.map((u) => (
                  <li key={u.slug}>
                    <time className="mono" dateTime={u.frontmatter.date}>{fmtDate(u.frontmatter.date)}</time>
                    <Link href={`/journal/${u.slug}`}>{u.frontmatter.title}</Link>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="muted">No updates yet.</p>
            )}
          </aside>
        </div>
      </article>
      <JsonLd data={graph(articleLd({ title: p.title, description: p.summary[0], path: `/projects/${p.slug}`, published: p.startedOn ?? "2026-08-25", type: "BlogPosting" }))} />
    </Folio>
  );
}
