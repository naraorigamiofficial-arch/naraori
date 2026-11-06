import Link from "next/link";
import "@/styles/pages.css";
import "@/styles/atlas.css";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { EnquiryForm } from "@/components/EnquiryForm";
import { Folio } from "@/components/Folio";
import { identity } from "@/content/identity";
import { countryOptions } from "@/lib/countries";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Commissions: original origami sculpture",
  description: `Commission an original origami sculpture from ${identity.person.name}, acquire an existing work, or propose a collaboration. How enquiries are reviewed, budgets, timelines and shipping.`,
  path: "/commissions",
});

export default async function CommissionsPage(props: PageProps<"/commissions">) {
  const sp = await props.searchParams;
  const about = typeof sp.about === "string" ? sp.about.slice(0, 120) : undefined;
  return (
    <Folio>
      <Breadcrumbs items={[{ name: "Commissions", path: "/commissions" }]} />
      <header className="frame page-head" style={{ borderBottom: 0 }}>
        <span className="eyebrow">Commissions &amp; collaborations</span>
        <h1 className="title-1">A sculpture made for a purpose</h1>
        <p className="lede">Original works are designed from a blank sheet, from the crease pattern to the final shaping. Commissions are accepted selectively, when the subject and scope suit that way of working.</p>
      </header>

      <section className="frame section-tight split">
        <div>
          <h2 className="title-3">What can be considered</h2>
        </div>
        <ol className="steps">
          <li><div><h3>Private commissions</h3><p>A one-of-a-kind sculpture for a personal collection or residence, a figure from history, myth or your own story.</p></div></li>
          <li><div><h3>Existing works</h3><p>Some finished sculptures may be available. Ask about a specific piece from the <Link href="/artworks">archive</Link>.</p></div></li>
          <li><div><h3>Brand &amp; institutional collaborations</h3><p>Custom origami works for commercial displays, editorial features, exhibitions or packaging.</p></div></li>
        </ol>
      </section>

      <section className="frame section-tight split">
        <h2 className="title-3">How an enquiry is reviewed</h2>
        <ol className="steps">
          <li><div><h3>You write</h3><p>Describe the subject, the setting, your timeline and a budget range if you have one.</p></div></li>
          <li><div><h3>The studio considers it</h3><p>Each enquiry is read personally. Not every commission can be accepted; when one is not a good fit, you will be told plainly.</p></div></li>
          <li><div><h3>Scope and design</h3><p>If it goes ahead, size, sheet, timeline and cost are agreed in writing before design begins. Complex single-sheet designs take weeks to months.</p></div></li>
          <li><div><h3>Delivery and documentation</h3><p>Collection, packing and shipping of a fragile paper sculpture are planned together, with a record of the work’s title, date and materials.</p></div></li>
        </ol>
      </section>

      <section className="frame section split" aria-labelledby="enquire-title">
        <div>
          <h2 id="enquire-title" className="title-2">Make an enquiry</h2>
          <p className="muted" style={{ marginTop: "1rem" }}>Or write directly to <a href={`mailto:${identity.contact.email}?subject=Commission%20enquiry`}>{identity.contact.email}</a>.</p>
          <p className="meta">Looking for paper rather than a sculpture? Use the <Link href="/shop">Paper Shop</Link>.</p>
        </div>
        <EnquiryForm countries={countryOptions()} about={about} defaultKind={about ? "acquisition" : "commission"} />
      </section>
    </Folio>
  );
}
