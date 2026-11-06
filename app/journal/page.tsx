import Link from "next/link";
import "@/styles/editorial.css";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Folio } from "@/components/Folio";
import { identity } from "@/content/identity";
import { getProject } from "@/content/projects";
import { getJournal } from "@/lib/content";
import { fmtDate } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Journal: notes from the studio",
  description: `Studio notes from ${identity.person.name}: work in progress, test folds, experiments and announcements from Nara Origami.`,
  path: "/journal",
});

export default async function JournalPage() {
  const entries = await getJournal();
  return (
    <Folio>
      <Breadcrumbs items={[{ name: "Journal", path: "/journal" }]} />
      <header className="frame page-head">
        <span className="eyebrow">Journal</span>
        <h1 className="title-1">Notes from the studio</h1>
        <p className="lede">Short entries written at the folding table: progress, experiments and the occasional announcement. For structured lessons, see <Link href="/learn">Learn</Link>.</p>
      </header>
      <ol className="frame journal-list">
        {entries.map((e) => {
          const project = e.frontmatter.project ? getProject(e.frontmatter.project) : null;
          return (
            <li key={e.slug}>
              <time className="mono" dateTime={e.frontmatter.date}>{fmtDate(e.frontmatter.date)}</time>
              <div>
                <h2 className="title-3"><Link href={`/journal/${e.slug}`}>{e.frontmatter.title}</Link></h2>
                <p className="muted">{e.frontmatter.description}</p>
                {project && <p className="meta">Project: <Link href={`/projects/${project.slug}`}>{project.title}</Link></p>}
              </div>
            </li>
          );
        })}
      </ol>
    </Folio>
  );
}
