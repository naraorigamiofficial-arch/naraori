import Image from "next/image";
import Link from "next/link";
import "@/styles/pages.css";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Folio } from "@/components/Folio";
import { JsonLd } from "@/components/JsonLd";
import { publishedArtworks } from "@/content/artworks";
import { identity } from "@/content/identity";
import { publishedProjects } from "@/content/projects";
import { graph, pageMetadata, personLd } from "@/lib/seo";

export const metadata = pageMetadata({
  title: `About ${identity.person.name}, Indian origami artist`,
  description: `${identity.person.name}, known as ${identity.artistName}, is an Indian origami artist and designer of complex single-sheet sculptures, founder of ${identity.studio.name} and administrator of the ${identity.sioa.name}.`,
  path: "/about",
  type: "profile",
  image: { url: identity.person.portrait.src, width: identity.person.portrait.width, height: identity.person.portrait.height, alt: identity.person.portrait.alt },
});

export default function AboutPage() {
  const works = publishedArtworks().sort((a, b) => a.catalogueNo.localeCompare(b.catalogueNo));
  const p = identity.person;
  return (
    <Folio>
      <Breadcrumbs items={[{ name: "About", path: "/about" }]} />
      <header className="frame about-hero">
        <Image src={p.portrait.src} alt={p.portrait.alt} width={p.portrait.width} height={p.portrait.height} preload fetchPriority="high" sizes="(min-width: 760px) 30vw, 70vw" />
        <div>
          <span className="eyebrow">The artist</span>
          <h1 className="display">{p.name}</h1>
          <p className="lede" style={{ marginTop: "1rem" }}>
            Origami artist and designer from India, working under the name <b>{identity.artistName}</b>. Founder of the paper studio {identity.studio.name}.
          </p>
        </div>
      </header>

      <section className="frame section-tight split" aria-labelledby="bio-title">
        <div>
          <h2 id="bio-title" className="eyebrow">Biography</h2>
          <p className="statement">“My work uses origami as a medium to share stories, culture, and values through paper.”</p>
        </div>
        <div className="prose">
          <p>
            <b>In brief.</b> {p.name} ({identity.artistName}) is an Indian origami artist who designs complex original sculptures, each folded from a single sheet of paper. Through {identity.studio.name} he creates original works, undertakes commissioned projects, collaborates with brands and organisations, and makes specialist double-tissue paper for other folders.
          </p>
          <p>
            In his words: “I am an origami artist from India. Through Nara Origami Originals, I create original paper sculptures, undertake commissioned projects, and collaborate with brands and organizations. My work uses origami as a medium to share stories, culture, and values through paper.”
          </p>
          <p>
            “I primarily work with the box pleating design method and specialize in creating complex sculptures from a single sheet of paper. My preferred material is double tissue paper, which I produce by hand for my own work and also make available to other origami artists.”
          </p>
          <p>
            “I am also the administrator and developer of the Society of Indian Origami Artists (SIOA), where I work to support artists, promote origami, and help build a stronger origami community in India.”
          </p>
        </div>
      </section>

      <section className="frame section-tight split" aria-labelledby="approach-title">
        <h2 id="approach-title" className="title-2">Approach</h2>
        <div className="prose">
          <p>His subjects come from history, mythology and legend (Lord Rama, Sun Wukong, mounted archers and original characters such as Agniv, the Monk of Fire) and from figures he grew up hearing about, such as Chhatrapati Shivaji Maharaj.</p>
          <p>The works are designed on large grids (52, 56, 64 and 64 × 128 among them) and folded from very large sheets: 150 cm squares and 1 m × 2 m rectangles. Each design moves from grid and pre-creasing, through collapse, to many hours of shaping. <Link href="/learn/from-grid-to-finished-fold">See the six stages of a fold</Link>.</p>
        </div>
      </section>

      <section className="frame section-tight split" aria-labelledby="works-title">
        <h2 id="works-title" className="title-2">Major works</h2>
        <div>
          <ul className="works-index">
            {works.map((w) => (
              <li key={w.slug}>
                <Link href={`/artworks/${w.slug}`}>
                  <span className="mono">{w.catalogueNo}</span>
                  <b>{w.title}{w.alternateTitle ? ` (${w.alternateTitle})` : ""}</b>
                  <span className="mono">{w.year ?? ""}</span>
                </Link>
              </li>
            ))}
            {publishedProjects().map((pr) => (
              <li key={pr.slug}>
                <Link href={`/projects/${pr.slug}`}>
                  <span className="mono">Studio</span>
                  <b>{pr.title}</b>
                  <span className="mono">{pr.status}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="frame section-tight split" aria-labelledby="roles-title">
        <h2 id="roles-title" className="title-2">Professional activities</h2>
        <div className="prose">
          <h3>{identity.studio.name}</h3>
          <p>{identity.positioning} <Link href="/shop">The Paper Atlas</Link>.</p>
          <h3>{identity.sioa.name} ({identity.sioa.shortName})</h3>
          <p>
            {identity.sioa.role} of {identity.sioa.shortName}, an independent organisation supporting origami artists in India.
            {identity.sioa.url && <> <a href={identity.sioa.url} rel="noopener">Visit the {identity.sioa.shortName} website</a>.</>}
          </p>
          <h3>Commissions and collaborations</h3>
          <p>Private commissions, acquisitions and collaborations with brands and institutions. <Link href="/commissions">How commissions work</Link>.</p>
          {identity.profiles.length > 0 && (
            <>
              <h3>Official profiles</h3>
              <ul>{identity.profiles.map((pr) => <li key={pr.url}><a href={pr.url} rel="me noopener">{pr.label}</a></li>)}</ul>
            </>
          )}
          <p className="meta">Press and publication credits will be listed on the <Link href="/press">press page</Link> as they are verified.</p>
        </div>
      </section>
      <JsonLd data={graph({ "@type": "ProfilePage", "@id": `${personLd()["@id"]}-profile`, mainEntity: { "@id": personLd()["@id"] }, url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://naraori.in"}/about` })} />
    </Folio>
  );
}
