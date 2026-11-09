import Image from "next/image";
import Link from "next/link";
import "@/styles/home.css";
import "@/styles/diagram.css";
import { ArchivalCaption } from "@/components/ArchivalCaption";
import { ArtworkMount } from "@/components/ArtworkMount";
import { Folio } from "@/components/Folio";
import { SheetDiagram } from "@/components/SheetDiagram";
import { Turntable } from "@/components/Turntable";
import { getArtwork } from "@/content/artworks";
import { products } from "@/content/catalogue";
import { identity } from "@/content/identity";
import { publishedProjects } from "@/content/projects";
import { getJournal, getLearn } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: `${identity.artistName} | Origami sculpture by ${identity.person.name}`,
  description: `The archive of Indian origami artist ${identity.person.name}: complex original sculptures folded from a single sheet, origami design lessons, and hand-treated large-format double-tissue paper.`,
  path: "/",
});

export default async function Home() {
  const hero = getArtwork("sun-wukong-the-monkey-king")!;
  const [rama, agniv, sun] = ["maryada-purushottam", "agniv-the-monk-of-fire", "sunstriker"].map((s) => getArtwork(s)!);
  const [learn, journal] = await Promise.all([getLearn(), getJournal()]);
  const projects = publishedProjects();
  const sheetSizes = products.filter((p) => p.sizeCm && p.published).map((p) => ({ cm: p.sizeCm!, label: `${p.sizeCm} cm` }));

  return (
    <Folio>
      {/* ---------- Opening: the sculpture turns as you scroll ---------- */}
      <section className="home-stage" aria-labelledby="home-title">
        <Turntable
          footer={
            <nav aria-label="Where to begin" className="stage-routes">
              <Link href="/artworks"><span className="mono">I</span> Explore the artwork</Link>
              <Link href="/shop"><span className="mono">II</span> Find paper</Link>
              <Link href="/learn"><span className="mono">III</span> Learn origami design</Link>
            </nav>
          }
        >
          <span className="eyebrow">Nara Origami</span>
          <h1 id="home-title" className="stage-name">{identity.person.name}</h1>
          <p className="stage-role">Original origami sculpture, from a single sheet of paper.</p>
        </Turntable>
      </section>

      <section className="frame home-intro" aria-label="Introduction">
        <p className="home-statement">
          Deities, warriors and characters from history and legend, designed on grids of up to 128 divisions and folded from sheets as large as two metres.
        </p>
      </section>

      {/* ---------- Selected works ---------- */}
      <section className="frame section" aria-labelledby="works-title">
        <header className="section-head">
          <span className="index">§ 01</span>
          <h2 id="works-title" className="title-2">Selected works</h2>
        </header>
        <div className="works-composition">
          <article className="wc wc-rama">
            <ArtworkMount artwork={rama} aspect="1 / 1" sizes="(min-width: 900px) 52vw, 100vw" />
            <ArchivalCaption artwork={rama} />
          </article>
          <article className="wc wc-agniv">
            <ArtworkMount artwork={agniv} aspect="16 / 8" fit="cover" sizes="(min-width: 900px) 74vw, 100vw" />
            <ArchivalCaption artwork={agniv} />
          </article>
          <article className="wc wc-sun">
            <ArchivalCaption artwork={sun} />
            <ArtworkMount artwork={sun} aspect="4 / 5" sizes="(min-width: 900px) 44vw, 100vw" />
          </article>
          <article className="wc wc-wukong">
            <ArtworkMount artwork={hero} aspect="4 / 5" sizes="(min-width: 900px) 40vw, 100vw" />
            <ArchivalCaption artwork={hero} />
          </article>
        </div>
        <p className="section-foot">
          <Link className="link-arrow" href="/artworks">The complete archive</Link>
        </p>
      </section>

      {/* ---------- The artist ---------- */}
      <section className="frame section home-artist" aria-labelledby="artist-title">
        <header className="section-head">
          <span className="index">§ 02</span>
          <h2 id="artist-title" className="title-2">The artist</h2>
        </header>
        <div className="artist-body">
          <Image src={identity.person.portrait.src} alt={identity.person.portrait.alt} width={identity.person.portrait.width} height={identity.person.portrait.height} sizes="(min-width: 900px) 22vw, 60vw" className="artist-portrait" />
          <div className="artist-text">
            <p className="lede" style={{ maxWidth: "34ch" }}>
              “My work uses origami as a medium to share stories, culture, and values through paper.”
            </p>
            <p>
              {identity.person.name} works primarily with the box-pleating design method and specialises in complex sculptures from a single sheet. His preferred material is double-tissue paper, which he makes by hand for his own work, and, through {identity.studio.name}, for other origami artists.
            </p>
            <p>He is also the administrator and developer of the {identity.sioa.name} ({identity.sioa.shortName}).</p>
            <Link className="link-arrow" href="/about">About {identity.person.name}</Link>
          </div>
        </div>
      </section>

      {/* ---------- Studio & materials ---------- */}
      <section className="home-studio" aria-labelledby="studio-title">
        <div className="frame section">
          <header className="section-head">
            <span className="index">§ 03</span>
            <h2 id="studio-title" className="title-2">The paper studio</h2>
          </header>
          <div className="studio-body">
            <div>
              <p className="lede">{identity.positioning}</p>
              <p>The same hand-treated double tissue used for every sculpture in the archive: small squares for learning, large-format sheets for complex work, and made-to-order sheets up to six metres, pre-gridded or duo-colour.</p>
              <p style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
                <Link className="btn" href="/shop">Open the Paper Atlas</Link>
                <Link className="btn btn-quiet" href="/learn/grids-and-sheet-size">Which size do I need?</Link>
              </p>
            </div>
            <figure>
              <SheetDiagram sheets={sheetSizes} selectedCm={100} title="Standard sheet sizes, from 10 cm to 150 cm, compared to an A4 page" />
              <figcaption className="meta">Drawn to scale relative to each other, not actual size on your screen. Highlighted: 100 cm.</figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* ---------- Understanding the fold ---------- */}
      <section className="frame section" aria-labelledby="learn-title">
        <header className="section-head">
          <span className="index">§ 04</span>
          <h2 id="learn-title" className="title-2">Understanding the fold</h2>
        </header>
        <div className="process-strip" role="list" aria-label="Six stages of The Monkey King">
          {hero.process!.map((p, i) => (
            <Link role="listitem" key={p.image.src} href="/learn/from-grid-to-finished-fold" className="ps-frame">
              <Image src={p.image.src} alt={p.image.alt} width={p.image.width} height={p.image.height} sizes="(min-width: 900px) 15vw, 40vw" quality={70} />
              <span className="mono">0{i + 1} · {p.title}</span>
            </Link>
          ))}
        </div>
        <ul className="article-index">
          {learn.map((d) => (
            <li key={d.slug}>
              <Link href={`/learn/${d.slug}`}>
                <span className="mono">{d.frontmatter.section}</span>
                <b>{d.frontmatter.title}</b>
                <span className="muted">{d.frontmatter.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- From the studio ---------- */}
      <section className="frame section" aria-labelledby="desk-title">
        <header className="section-head">
          <span className="index">§ 05</span>
          <h2 id="desk-title" className="title-2">On the studio desk</h2>
        </header>
        <div className="desk">
          <ul className="desk-projects">
            {projects.map((p) => (
              <li key={p.slug}>
                <Link href={`/projects/${p.slug}`}>
                  <span className="tag">{p.status}</span>
                  <b>{p.title}</b>
                  <span className="muted">{p.summary[0].split(". ").slice(0, 2).join(". ")}.</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="desk-journal">
            <span className="eyebrow">Latest from the journal</span>
            <ul>
              {journal.slice(0, 4).map((j) => (
                <li key={j.slug}>
                  <time className="mono" dateTime={j.frontmatter.date}>{fmtDate(j.frontmatter.date)}</time>
                  <Link href={`/journal/${j.slug}`}>{j.frontmatter.title}</Link>
                </li>
              ))}
            </ul>
            <Link className="link-arrow" href="/journal">All journal entries</Link>
          </div>
        </div>
      </section>

      {/* ---------- Professional contact ---------- */}
      <section className="frame section home-contact" aria-labelledby="contact-title">
        <header className="section-head">
          <span className="index">§ 06</span>
          <h2 id="contact-title" className="title-2">Commissions, exhibitions &amp; collaborations</h2>
        </header>
        <div className="contact-body">
          <p className="lede">Private commissions, the acquisition of existing work, and collaborations with brands, institutions and publications are considered individually.</p>
          <p style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <Link className="btn" href="/commissions">Make an enquiry</Link>
            <Link className="btn btn-quiet" href="/press">Press information</Link>
          </p>
        </div>
      </section>
    </Folio>
  );
}

function fmtDate(d: string) {
  return new Date(d + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
