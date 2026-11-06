import Link from "next/link";
import "@/styles/pages.css";
import "@/styles/atlas.css";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { EnquiryForm } from "@/components/EnquiryForm";
import { Folio } from "@/components/Folio";
import { identity } from "@/content/identity";
import { countryOptions } from "@/lib/countries";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Contact", description: `Contact ${identity.person.name} and the ${identity.studio.name} studio: commissions, paper orders, press and general enquiries.`, path: "/contact" });

export default function ContactPage() {
  return (
    <Folio>
      <Breadcrumbs items={[{ name: "Contact", path: "/contact" }]} />
      <header className="frame page-head">
        <span className="eyebrow">Contact</span>
        <h1 className="title-1">Write to the studio</h1>
      </header>
      <section className="frame section-tight split">
        <div className="prose">
          <p><b>Email</b><br /><a href={`mailto:${identity.contact.email}`}>{identity.contact.email}</a></p>
          <p><b>Paper orders</b><br />Use the <Link href="/shop">Paper Atlas</Link> and submit an order request. It reaches the studio with all the details.</p>
          <p><b>Commissions &amp; press</b><br /><Link href="/commissions">Commissions</Link> · <Link href="/press">Press information</Link></p>
          <p className="meta">Based in {identity.contact.location}. The studio does not receive visitors at a public address.</p>
        </div>
        <EnquiryForm countries={countryOptions()} defaultKind="general" />
      </section>
    </Folio>
  );
}
