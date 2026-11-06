import "@/styles/atlas.css";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Folio } from "@/components/Folio";
import { OrderRequestForm } from "@/components/OrderRequestForm";
import { identity } from "@/content/identity";
import { countryOptions } from "@/lib/countries";
import { studioInbox } from "@/lib/notifications";
import { getCatalogueSafe, getStore } from "@/lib/store";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata({ title: "Your order sheet", description: "Review your paper order request.", path: "/order-request", noindex: true, image: null });

export default async function OrderRequestPage() {
  const catalogue = await getCatalogueSafe();
  const available = !!getStore() && !!studioInbox();
  return (
    <Folio>
      <Breadcrumbs items={[{ name: "Paper Shop", path: "/shop" }, { name: "Order sheet", path: "/order-request" }]} />
      <header className="frame page-head" style={{ borderBottom: 0 }}>
        <span className="eyebrow">Order request</span>
        <h1 className="title-1">Your order sheet</h1>
        <p className="lede">Review the paper you have chosen, then send it to the studio. Nothing is charged now: the studio confirms availability and the final total by email first.</p>
      </header>
      <div className="frame">
        <OrderRequestForm catalogue={catalogue} countries={countryOptions()} available={available} />
        <p className="meta" style={{ marginTop: "2rem" }}>
          Prefer email? Write to <a href={`mailto:${identity.contact.email}?subject=Paper%20order`}>{identity.contact.email}</a> with the sizes, colours and quantities you need.
        </p>
      </div>
    </Folio>
  );
}
