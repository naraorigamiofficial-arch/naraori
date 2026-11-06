import Link from "next/link";
import { Policy } from "@/components/Policy";
import { shipping } from "@/content/catalogue";
import { identity } from "@/content/identity";
import { formatINR, formatUSDCents } from "@/lib/shop/money";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Shipping & ordering", description: "How paper order requests work, delivery within India and internationally, packing and lead times.", path: "/shipping" });

export default function ShippingPage() {
  return (
    <Policy title="Shipping & ordering" path="/shipping" updated="6 November 2026">
      <h2>How ordering works</h2>
      <ol>
        <li>Choose paper in the <Link href="/shop">Paper Atlas</Link> and submit an <b>order request</b>. No account and no payment are needed.</li>
        <li>The studio checks availability and emails you the confirmed total, including shipping, and how to pay.</li>
        <li>Your order is accepted only when you and the studio have both confirmed it by email. Paper is prepared after payment.</li>
      </ol>
      <h2>Shipping estimates</h2>
      <ul>
        <li><b>Within India:</b> {formatINR(shipping.domestic.flat)} per order{shipping.domestic.freeAbove !== null ? `, free above ${formatINR(shipping.domestic.freeAbove)}` : ""}.</li>
        <li><b>International:</b> from {formatUSDCents(shipping.international.flatUsdCents)}. Prices of the paper are the same; the exact shipping cost depends on destination and sheet size and is quoted by email.</li>
      </ul>
      <p>{shipping.note}</p>
      <h2>Lead times</h2>
      <p>Paper is made in small batches by hand. Standard sizes are usually confirmed within a few days of your request. Large custom, gridded or oversize sheets are made to order: please allow at least one month before your project date.</p>
      <h2>Packing</h2>
      <p>Small sheets are packed flat. Large sheets are rolled to avoid hard creases. Packing is confirmed with your order.</p>
      <h2>Questions</h2>
      <p>Write to <a href={`mailto:${identity.contact.email}`}>{identity.contact.email}</a>, quoting your order reference if you have one.</p>
    </Policy>
  );
}
