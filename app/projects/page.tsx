import Link from "next/link";
import "@/styles/editorial.css";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Folio } from "@/components/Folio";
import { identity } from "@/content/identity";
import { publishedProjects } from "@/content/projects";
import { getJournal } from "@/lib/content";
import { fmtDate } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "In the studio: origami projects in progress",
  description: `Long-running origami design projects by ${identity.person.name}, in his own words: Vajrabhairava, the Chhatrapati Shivaji Maharaj re-design and more.`,
  path: "/projects",
});

export default async function ProjectsPage() {
  const projects = publishedProjects();
  const journal = await getJournal();
  return (
    <Folio>
      <Breadcrumbs items={[{ name: "Studio", path: "/projects" }]} />
      <header className="frame page-head">
        <span className="eyebrow">In the studio</span>
        <h1 className="title-1">Projects on the desk</h1>
        <p className="lede">Designs that are still being worked out: ideas, test folds and re-designs. Finished sculptures move to the <Link href="/artworks">archive</Link>.</p>
      </header>
      <ol className="frame project-ledger">
        {projects.map((p, i) => {
          const updates = journal.filter((j) => j.frontmatter.project === p.slug);
          return (
            <li key={p.slug}>
              <span className="mono pl-no">P{String(i + 1).padStart(2, "0")}</span>
              <div className="pl-main">
                <h2 className="title-3"><Link href={`/projects/${p.slug}`}>{p.title}</Link></h2>
                <p>{p.summary[0]}</p>
              </div>
              <dl className="pl-meta">
                <div><dt>Status</dt><dd><span className="tag">{p.status}</span></dd></div>
                {p.startedOn && <div><dt>Started</dt><dd>{fmtDate(p.startedOn)}</dd></div>}
                <div><dt>Updates</dt><dd>{updates.length}</dd></div>
              </dl>
            </li>
          );
        })}
      </ol>
    </Folio>
  );
}
