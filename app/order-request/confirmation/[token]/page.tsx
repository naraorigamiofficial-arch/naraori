import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "@/styles/atlas.css";
import { Folio } from "@/components/Folio";
import { identity } from "@/content/identity";
import { shippingText } from "@/lib/email/templates";
import { formatINR } from "@/lib/shop/money";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Order request received", robots: { index: false, follow: false } };

/**
 * Reached via an unguessable 128-bit token, never via the reference. Shows no personal data:
 * no name, email or location, only the reference and the item summary.
 */
export default async function Confirmation(props: PageProps<"/order-request/confirmation/[token]">) {
  const { token } = await props.params;
  const sp = await props.searchParams;
  if (!/^[A-Za-z0-9_-]{20,40}$/.test(token)) notFound();
  const order = await getStore()?.getOrderByToken(token);
  if (!order) notFound();
  const customerEmailed = sp.customer === "1";
  return (
    <Folio>
      <div className="frame section">
        <span className="eyebrow">Order request received</span>
        <h1 className="title-1">Thank you.</h1>
        <p className="lede" style={{ marginTop: "1rem" }}>
          Your reference is <strong style={{ whiteSpace: "nowrap" }}>{order.reference}</strong>.
        </p>
        <div className="notice" style={{ maxWidth: "48rem", marginTop: "1.5rem" }}>
          <p style={{ margin: 0 }}>
            <strong>This is a request, not a confirmed purchase.</strong> Nothing has been charged. The studio will check availability and email you the final total, including shipping, and how to pay.
          </p>
        </div>
        <p style={{ marginTop: "1.5rem", maxWidth: "48rem" }}>
          {customerEmailed
            ? "A copy of your request has been emailed to you. If it hasn’t arrived in a few minutes, please check your spam folder."
            : `Your request is safely recorded, but our confirmation email to you could not be sent just now. The studio has your request and will still reply. You can also write to ${identity.contact.email} quoting your reference.`}
        </p>
        <h2 className="eyebrow" style={{ marginTop: "2.5rem" }}>Summary</h2>
        <ul className="sheet-lines" style={{ maxWidth: "48rem" }}>
          {order.lines.map((l) => (
            <li key={`${l.sku}-${l.colourId}`} className="sheet-line">
              <span className="line-name"><b>{l.productName}</b><span className="muted">{l.optionLabel} · {l.colourName}</span></span>
              <span className="mono">× {l.units}</span>
              <span className="line-total">{l.lineTotal === null ? "By enquiry" : formatINR(l.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="totals" style={{ maxWidth: "48rem" }}>
          <dt>Subtotal (estimate)</dt><dd>{formatINR(order.subtotal)}</dd>
          <dt>Shipping (estimate)</dt><dd>{shippingText(order)}</dd>
        </dl>
        <p style={{ marginTop: "2rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Link className="btn btn-quiet" href="/artworks">Explore the artwork</Link>
          <Link className="btn btn-quiet" href="/learn">Learn origami design</Link>
        </p>
      </div>
    </Folio>
  );
}
