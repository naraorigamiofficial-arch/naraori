import Link from "next/link";
import { breadcrumbLd } from "@/lib/seo";
import { JsonLd } from "./JsonLd";

export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  const all = [{ name: "Home", path: "/" }, ...items];
  return (
    <nav aria-label="Breadcrumb" className="crumbs frame">
      <ol>
        {all.map((it, i) => (
          <li key={it.path}>{i === all.length - 1 ? <span aria-current="page">{it.name}</span> : <Link href={it.path}>{it.name}</Link>}</li>
        ))}
      </ol>
      <JsonLd data={{ "@context": "https://schema.org", ...breadcrumbLd(all) }} />
    </nav>
  );
}
