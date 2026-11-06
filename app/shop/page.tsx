import Link from "next/link";
import "@/styles/atlas.css";
import "@/styles/diagram.css";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Folio } from "@/components/Folio";
import { JsonLd } from "@/components/JsonLd";
import { PaperAtlas } from "@/components/PaperAtlas";
import { identity } from "@/content/identity";
import { formatINR, formatUSDCents } from "@/lib/shop/money";
import { publicProducts } from "@/lib/shop/catalogue";
import { getCatalogueSafe } from "@/lib/store";
import { graph, pageMetadata, productLd } from "@/lib/seo";

export const revalidate = 300;

export const metadata = pageMetadata({
  title: "Paper Shop: treated double-tissue origami paper, India",
  description: "The Paper Atlas: hand-treated double-tissue origami paper from 10 cm to 6 m: large-format sheets for complex models, custom grids and duo-colour. Order requests from India and worldwide.",
  path: "/shop",
});

export default async function ShopPage(props: PageProps<"/shop">) {
  const cat = await getCatalogueSafe();
  const products = publicProducts(cat);
  const sp = await props.searchParams;
  const initial = typeof sp.size === "string" && products.some((p) => p.slug === sp.size) ? sp.size : undefined;
  const s = cat.shipping;
  return (
    <Folio>
      <Breadcrumbs items={[{ name: "Paper Shop", path: "/shop" }]} />
      <header className="frame atlas-head">
        <div>
          <span className="eyebrow">{identity.studio.name} · The Paper Atlas</span>
          <h1 className="title-1">Paper for complex folding</h1>
        </div>
        <p className="lede">{identity.positioning} The same double tissue used for every sculpture in the archive. Choose a sheet by size, colour and what you are folding.</p>
      </header>

      <div className="frame">
        <PaperAtlas products={products} colours={cat.colours} initialSlug={initial} />
      </div>

      <section className="frame section" aria-labelledby="ledger-title">
        <header className="section-head">
          <span className="index">Catalogue</span>
          <h2 id="ledger-title" className="title-3">Every sheet at a glance</h2>
        </header>
        <div className="table-scroll" tabIndex={0} role="region" aria-label="Paper catalogue">
          <table>
            <thead>
              <tr><th scope="col">Sheet</th><th scope="col">Sold as</th><th scope="col" className="num">Price</th><th scope="col" className="num">Minimum</th><th scope="col">Availability</th></tr>
            </thead>
            <tbody>
              {products.flatMap((p) =>
                p.options.map((o, i) => (
                  <tr key={o.sku}>
                    {i === 0 && <th scope="row" rowSpan={p.options.length}><Link href={`/shop/${p.slug}`}>{p.shortName}</Link></th>}
                    <td>{o.label}</td>
                    <td className="num">{p.pricing === "enquiry" ? "By enquiry" : formatINR(o.unitPrice)}</td>
                    <td className="num">{o.minUnits}</td>
                    <td>{o.availability === "unavailable" ? "Unavailable" : p.pricing === "enquiry" ? "Made to order" : "Made in small batches"}</td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="frame section-tight guide" aria-labelledby="guide-title">
        <header className="section-head">
          <span className="index">Buying guide</span>
          <h2 id="guide-title" className="title-3">Which sheet do you need?</h2>
        </header>
        <div className="guide-grid">
          <div>
            <h3>Start from the design, not the paper</h3>
            <p>If your design uses a grid, divide the sheet size by the grid to find the size of one cell. A 64 grid on a 100 cm sheet gives cells of about 1.6 cm; on a 50 cm sheet, under 8 mm. The smaller the cells, the more layers stack up in each flap. <Link href="/learn/grids-and-sheet-size">Read the full guide and use the calculator</Link>.</p>
          </div>
          <div>
            <h3>Scale changes everything</h3>
            <p>The studio&apos;s own sculptures are folded from 150 cm squares and 1 m × 2 m rectangles. Small squares are best for learning and test folds; large-format sheets for figures with many fine flaps.</p>
          </div>
          <div>
            <h3>Made to order</h3>
            <p>Paper is treated by hand. Large custom or gridded sheets need at least one month; custom grids up to 256 lines are made only when a production slot is open.</p>
          </div>
        </div>
      </section>

      <section className="frame section-tight" aria-labelledby="how-title">
        <div className="how">
          <div>
            <span className="eyebrow">How ordering works</span>
            <h2 id="how-title" className="title-3">An order request, not a checkout</h2>
          </div>
          <ol>
            <li>Add sheets to your order sheet and submit a request. No account, no payment.</li>
            <li>The studio checks availability and emails you the final total, including shipping.</li>
            <li>You pay only after you have agreed to the confirmed total.</li>
          </ol>
          <p className="meta">
            Estimated shipping within India: {formatINR(s.domestic.flat)}, free above {s.domestic.freeAbove !== null ? formatINR(s.domestic.freeAbove) : "n/a"}. International: from {formatUSDCents(s.international.flatUsdCents)}. <Link href="/shipping">Shipping &amp; ordering policy</Link>.
          </p>
        </div>
      </section>
      <JsonLd data={graph(...products.filter((p) => p.pricing === "fixed").map(productLd))} />
    </Folio>
  );
}
