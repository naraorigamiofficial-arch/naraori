import Link from "next/link";
import "@/styles/editorial.css";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Folio } from "@/components/Folio";
import { identity } from "@/content/identity";
import { getLearn, LEARN_SECTIONS } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Learn origami design: grids, structure and materials",
  description: `A structured library on complex origami design by ${identity.person.name}: grids and sheet size, the stages of a complex fold, design systems and materials.`,
  path: "/learn",
});

const SECTION_NOTE: Record<string, string> = {
  Foundations: "Geometry, grids, bases, crease patterns and terminology.",
  "Design Systems": "Box pleating, 22.5° design, tree theory and hybrid methods.",
  "Materials and Folding": "Double tissue, thickness, treatment, shaping and finishing.",
  "Design Studies": "Breakdowns of original projects and the decisions behind them.",
};

export default async function LearnPage() {
  const docs = await getLearn();
  return (
    <Folio>
      <Breadcrumbs items={[{ name: "Learn", path: "/learn" }]} />
      <header className="frame page-head">
        <span className="eyebrow">The library</span>
        <h1 className="title-1">Learn origami design</h1>
        <p className="lede">Lessons for folders who want to understand how complex models are designed, not just how to fold them. Organised by subject, not by date.</p>
      </header>
      <div className="frame library">
        {LEARN_SECTIONS.map((s, i) => {
          const list = docs.filter((d) => d.frontmatter.section === s);
          return (
            <section key={s} className="lib-section" aria-labelledby={`sec-${i}`}>
              <header>
                <span className="mono">{String(i + 1).padStart(2, "0")}</span>
                <h2 id={`sec-${i}`} className="title-3">{s}</h2>
                <p className="muted">{SECTION_NOTE[s]}</p>
              </header>
              {list.length ? (
                <ul>
                  {list.map((d) => (
                    <li key={d.slug}>
                      <Link href={`/learn/${d.slug}`}>
                        <b>{d.frontmatter.title}</b>
                        <span className="muted">{d.frontmatter.description}</span>
                        <span className="mono">{d.frontmatter.difficulty} · {d.readingMinutes} min read</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="lib-empty mono">Lessons in preparation.</p>
              )}
            </section>
          );
        })}
      </div>
    </Folio>
  );
}
