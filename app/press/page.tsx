import Image from "next/image";
import Link from "next/link";
import "@/styles/pages.css";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Folio } from "@/components/Folio";
import { publishedArtworks } from "@/content/artworks";
import { identity } from "@/content/identity";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Press: information for journalists and curators",
  description: `Official biography, name and credit line, and approved photographs of the work of origami artist ${identity.person.name} (${identity.artistName}).`,
  path: "/press",
});

export default function PressPage() {
  const works = publishedArtworks().filter((a) => a.image);
  return (
    <Folio>
      <Breadcrumbs items={[{ name: "Press", path: "/press" }]} />
      <header className="frame page-head">
        <span className="eyebrow">Press &amp; media</span>
        <h1 className="title-1">Press information</h1>
        <p className="lede">For journalists, curators and event organisers.</p>
      </header>
      <section className="frame section-tight split">
        <h2 className="title-3">Name and credit</h2>
        <dl className="ledger">
          <div><dt>Full name</dt><dd>{identity.person.name}</dd></div>
          <div><dt>Artistic name</dt><dd>{identity.artistName}</dd></div>
          <div><dt>Studio</dt><dd>{identity.studio.name}</dd></div>
          <div><dt>Based in</dt><dd>{identity.contact.location}</dd></div>
          <div><dt>Credit line</dt><dd>Origami by {identity.person.name} ({identity.artistName})</dd></div>
          <div><dt>Website</dt><dd>naraori.in</dd></div>
        </dl>
      </section>
      <section className="frame section-tight split">
        <h2 className="title-3">Short biography</h2>
        <div className="press-copy">
          <p style={{ margin: 0 }}>
            {identity.person.name} ({identity.artistName}) is an Indian origami artist who designs complex original sculptures folded from a single sheet of paper, working primarily with the box-pleating method. Through his studio, {identity.studio.name}, he also produces hand-treated double-tissue paper for origami artists. He is the administrator and developer of the {identity.sioa.name} ({identity.sioa.shortName}).
          </p>
        </div>
      </section>
      <section className="frame section-tight">
        <header className="section-head"><span className="index">Images</span><h2 className="title-3">Selected artwork photographs</h2></header>
        <p className="muted" style={{ marginTop: "1rem", maxWidth: "60ch" }}>Please ask before publishing any image, and credit it as shown. High-resolution files are available on request.</p>
        <ul className="press-images">
          {works.map((a) => (
            <li key={a.slug}>
              <a href={a.image!.src} data-zoom className="zoomable" style={{ background: a.field }}>
                <Image src={a.image!.src} alt={a.image!.alt} width={a.image!.width} height={a.image!.height} sizes="(min-width: 900px) 22vw, 50vw" />
              </a>
              <span><b>{a.title}</b>{a.alternateTitle ? ` (${a.alternateTitle})` : ""}{a.year ? `, ${a.year}` : ""}</span>
              <span className="meta">Origami by {identity.person.name} · © {identity.person.name}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="frame section-tight split">
        <h2 className="title-3">Interviews &amp; publications</h2>
        <p className="muted">Verified interviews, publications and appearances will be listed here.</p>
      </section>
      <section className="frame section-tight split">
        <h2 className="title-3">Contact</h2>
        <p>Write to <a href={`mailto:${identity.contact.email}?subject=Press%20enquiry`}>{identity.contact.email}</a> or use the <Link href="/commissions">enquiry form</Link> (choose “Press or media”).</p>
      </section>
    </Folio>
  );
}
