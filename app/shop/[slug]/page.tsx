import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "@/styles/atlas.css";
import "@/styles/diagram.css";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Folio } from "@/components/Folio";
import { JsonLd } from "@/components/JsonLd";
import { PaperAtlas } from "@/components/PaperAtlas";
import { products as contentProducts } from "@/content/catalogue";
import { identity } from "@/content/identity";
import { formatINR } from "@/lib/shop/money";
import { publicProducts } from "@/lib/shop/catalogue";
import { getCatalogueSafe } from "@/lib/store";
import { graph, pageMetadata, productLd } from "@/lib/seo";

export const revalidate = 300;
export const generateStaticParams = async () => contentProducts.filter((p) => p.published).map((p) => ({ slug: p.slug }));

export async function generateMetadata(props: PageProps<"/shop/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const p = contentProducts.find((x) => x.slug === slug);
  if (!p) return {};
  return pageMetadata({
    title: `${p.name}: origami paper`,
    description: `${p.summary} ${p.pricing === "fixed" ? `From ${formatINR(Math.min(...p.options.map((o) => o.unitPrice / o.sheetsPerUnit)))} per sheet.` : "Price by enquiry."} Hand-treated by ${identity.studio.name}, India.`,
    path: `/shop/${p.slug}`,
  });
}

export default async function ProductPage(props: PageProps<"/shop/[slug]">) {
  const { slug } = await props.params;
  const cat = await getCatalogueSafe();
  const all = publicProducts(cat);
  const p = all.find((x) => x.slug === slug);
  if (!p) notFound();
  return (
    <Folio>
      <Breadcrumbs items={[{ name: "Paper Shop", path: "/shop" }, { name: p.shortName, path: `/shop/${p.slug}` }]} />
      <header className="frame atlas-head">
        <div>
          <span className="eyebrow">Specimen · {p.construction.split(" (")[0]}</span>
          <h1 className="title-1">{p.name}</h1>
        </div>
        <p className="lede">{p.summary}</p>
      </header>
      <div className="frame">
        <PaperAtlas products={all} colours={cat.colours} initialSlug={p.slug} />
      </div>
      <section className="frame section product-detail" aria-labelledby="detail-title">
        <header className="section-head">
          <span className="index">Details</span>
          <h2 id="detail-title" className="title-3">Everything to know before you order</h2>
        </header>
        <div className="detail-grid">
          <dl className="ledger">
            <div><dt>Exact size</dt><dd>{p.sizeLabel}</dd></div>
            <div><dt>Sold as</dt><dd>{p.options.map((o) => o.label).join("; ")}</dd></div>
            <div><dt>Price</dt><dd>{p.pricing === "fixed" ? p.options.map((o) => `${formatINR(o.unitPrice)} (${o.label.toLowerCase()})`).join("; ") : "By enquiry, quoted after review"}</dd></div>
            <div><dt>Currency</dt><dd>Indian rupees (INR). International orders are quoted by email.</dd></div>
            <div><dt>Minimum order</dt><dd>{p.options.map((o) => `${o.minUnits} × ${o.label.toLowerCase()}`).join("; ")}</dd></div>
            <div><dt>Approx. GSM</dt><dd className={p.gsm ? undefined : "unknown"}>{p.gsm ?? "Not yet measured"}</dd></div>
            <div><dt>Construction</dt><dd>{p.construction}</dd></div>
            <div><dt>Treatment</dt><dd>{p.treatment}</dd></div>
            <div><dt>Colours</dt><dd>{cat.colours.filter((c) => p.colourIds.includes(c.id)).map((c) => c.name).join(", ")}</dd></div>
            <div><dt>Availability</dt><dd>{p.pricing === "enquiry" ? "Made to order" : "Made in small batches; confirmed by email"}</dd></div>
            <div><dt>Packing</dt><dd>{p.packing}</dd></div>
            <div><dt>Delivery</dt><dd>Across India and internationally. <Link href="/shipping">Shipping policy</Link></dd></div>
            <div><dt>What happens next</dt><dd>Submit an order request; the studio confirms availability, the final total and payment details by email.</dd></div>
          </dl>
          <div>
            <h3 className="label">Suited to</h3>
            <ul>{p.applications.map((a) => <li key={a}>{a}</li>)}</ul>
            <h3 className="label">Please note</h3>
            <ul>{p.limitations.map((a) => <li key={a}>{a}</li>)}</ul>
          </div>
        </div>
      </section>
      {p.pricing === "fixed" && <JsonLd data={graph(productLd(p))} />}
    </Folio>
  );
}
