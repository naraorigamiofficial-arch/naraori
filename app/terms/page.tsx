import Link from "next/link";
import { Policy } from "@/components/Policy";
import { identity } from "@/content/identity";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Ordering terms", description: `Terms for paper order requests and the use of this website, ${identity.studio.name}.`, path: "/terms" });

export default function TermsPage() {
  return (
    <Policy title="Ordering terms" path="/terms" updated="6 November 2026">
      <p>These terms apply to paper order requests made on this website, operated by {identity.person.name} trading as {identity.studio.name}, {identity.contact.location}.</p>
      <h2>1. An order request is not a purchase</h2>
      <p>Submitting the order sheet sends a request to the studio. It does not create a contract, reserve stock, or charge you. Prices and shipping shown on the website are estimates until the studio confirms them by email.</p>
      <h2>2. Confirmation</h2>
      <p>The studio will reply by email with availability, the final total (including shipping) and payment details. An order exists only when you accept that confirmation and payment has been received. The studio may decline or partly accept a request, for example if a size or colour is not available.</p>
      <h2>3. Prices</h2>
      <p>Prices are in Indian rupees. Items marked “by enquiry” are quoted individually. If a price shown on the website was wrong, the studio will tell you before you pay.</p>
      <h2>4. Handmade material</h2>
      <p>Paper is hand-treated in small batches. Colour, texture and thickness can vary slightly between batches, and on-screen colours are approximate.</p>
      <h2>5. Delivery</h2>
      <p>Delivery estimates are given with your confirmation. See <Link href="/shipping">Shipping &amp; ordering</Link>.</p>
      <h2>6. Problems with an order</h2>
      <p>If paper arrives damaged or is not what you ordered, write within 7 days of delivery with photographs and your order reference, and the studio will work with you on a replacement or refund.</p>
      <h2>7. Artwork and content</h2>
      <p>All artwork, photographs, crease patterns and text on this website are the work of {identity.person.name} unless stated otherwise, and may not be reproduced without permission.</p>
      <h2>Contact</h2>
      <p><a href={`mailto:${identity.contact.email}`}>{identity.contact.email}</a></p>
    </Policy>
  );
}
