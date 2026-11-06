import type { Metadata } from "next";
import { identity, jsonLdIds, SITE_URL } from "@/content/identity";
import type { Artwork } from "./content-types";
import type { Product } from "./shop/types";

export const absolute = (p: string) => (p.startsWith("http") ? p : `${SITE_URL}${p.startsWith("/") ? "" : "/"}${p}`);

const DEFAULT_IMAGE = { url: "/media/artworks/sun-wukong-the-monkey-king.webp", width: 2565, height: 2565, alt: "The Monkey King, an origami sculpture by Abhijeet S. Vashistha" };

interface PageMeta {
  title: string;
  description: string;
  path: string;
  image?: { url: string; width: number; height: number; alt: string } | null;
  type?: "website" | "article" | "profile";
  noindex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
}

/** Every public page builds its metadata here, so titles/canonicals/OG never drift apart. */
export function pageMetadata(m: PageMeta): Metadata {
  const image = m.image === null ? undefined : (m.image ?? DEFAULT_IMAGE);
  return {
    title: m.title,
    description: m.description,
    alternates: { canonical: m.path },
    robots: m.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: m.type ?? "website",
      url: m.path,
      title: m.title,
      description: m.description,
      siteName: identity.artistName,
      locale: "en_IN",
      images: image ? [image] : undefined,
      ...(m.type === "article" ? { publishedTime: m.publishedTime, modifiedTime: m.modifiedTime, authors: [absolute("/about")] } : {}),
    },
    twitter: { card: "summary_large_image", title: m.title, description: m.description, images: image ? [image.url] : undefined },
  };
}

// ---------------- JSON-LD ----------------
type Json = Record<string, unknown>;

const sameAs = () => identity.profiles.map((p) => p.url).filter(Boolean);

export function personLd(): Json {
  return {
    "@type": "Person",
    "@id": jsonLdIds.person,
    name: identity.person.name,
    alternateName: [identity.artistName, ...identity.person.alternateNames],
    jobTitle: identity.person.jobTitle,
    nationality: { "@type": "Country", name: "India" },
    url: absolute("/about"),
    image: absolute(identity.person.portrait.src),
    description: `${identity.person.name}, known as ${identity.artistName}, is an Indian origami artist and designer of complex original paper sculptures folded from a single sheet.`,
    knowsAbout: ["Origami", "Origami design", "Box pleating", "Paper sculpture", "Double-tissue paper"],
    worksFor: { "@id": jsonLdIds.studio },
    memberOf: { "@id": jsonLdIds.sioa },
    ...(sameAs().length ? { sameAs: sameAs() } : {}),
  };
}

export function studioLd(): Json {
  return {
    "@type": "Organization",
    "@id": jsonLdIds.studio,
    name: identity.studio.name,
    alternateName: identity.artistName,
    url: SITE_URL,
    logo: absolute("/icon.svg"),
    description: identity.studio.description,
    founder: { "@id": jsonLdIds.person },
    email: identity.contact.email,
    areaServed: "Worldwide",
    address: { "@type": "PostalAddress", addressCountry: "IN" },
  };
}

export function sioaLd(): Json {
  return {
    "@type": "Organization",
    "@id": jsonLdIds.sioa,
    name: identity.sioa.name,
    alternateName: identity.sioa.shortName,
    ...(identity.sioa.url ? { url: identity.sioa.url } : {}),
  };
}

export function websiteLd(): Json {
  return {
    "@type": "WebSite",
    "@id": jsonLdIds.website,
    url: SITE_URL,
    name: identity.artistName,
    alternateName: [identity.studio.name, `${identity.artistName} by ${identity.person.name}`],
    publisher: { "@id": jsonLdIds.studio },
    about: { "@id": jsonLdIds.person },
    inLanguage: "en-IN",
    potentialAction: { "@type": "SearchAction", target: `${SITE_URL}/search?q={query}`, "query-input": "required name=query" },
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]): Json {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: absolute(it.path) })),
  };
}

export function artworkLd(a: Artwork): Json {
  return {
    "@type": "VisualArtwork",
    "@id": `${absolute(`/artworks/${a.slug}`)}#artwork`,
    name: a.title,
    ...(a.alternateTitle ? { alternateName: a.alternateTitle } : {}),
    url: absolute(`/artworks/${a.slug}`),
    creator: { "@id": jsonLdIds.person },
    artform: "Origami sculpture",
    artMedium: a.technical.paper ?? "Paper",
    artworkSurface: a.technical.sheetSize ? `${a.technical.sheets === 1 ? "Single sheet, " : ""}${a.technical.sheetSize}` : undefined,
    ...(a.year ? { dateCreated: String(a.year) } : {}),
    about: a.subject,
    description: a.intro,
    ...(a.image ? { image: { "@type": "ImageObject", url: absolute(a.image.src), width: a.image.width, height: a.image.height, caption: a.image.alt, creator: { "@id": jsonLdIds.person }, copyrightHolder: { "@id": jsonLdIds.person } } } : {}),
  };
}

export function articleLd(a: { title: string; description: string; path: string; published: string; updated?: string; image?: string; type?: "Article" | "BlogPosting" }): Json {
  return {
    "@type": a.type ?? "Article",
    headline: a.title,
    description: a.description,
    url: absolute(a.path),
    mainEntityOfPage: absolute(a.path),
    datePublished: a.published,
    dateModified: a.updated ?? a.published,
    author: { "@id": jsonLdIds.person },
    publisher: { "@id": jsonLdIds.studio },
    ...(a.image ? { image: absolute(a.image) } : {}),
    inLanguage: "en-IN",
  };
}

/**
 * Product markup. Offers are included only for fixed, published prices. Because purchases are
 * manual order requests (no checkout), we do NOT claim merchant-listing features such as
 * shipping/return policies; see SEO_IMPLEMENTATION.md.
 */
export function productLd(p: Product): Json {
  const priced = p.pricing === "fixed" ? p.options.filter((o) => o.availability !== "unavailable") : [];
  const prices = priced.map((o) => o.unitPrice / 100 / o.sheetsPerUnit);
  return {
    "@type": "Product",
    "@id": `${absolute(`/shop/${p.slug}`)}#product`,
    name: p.name,
    description: p.summary,
    brand: { "@id": jsonLdIds.studio },
    manufacturer: { "@id": jsonLdIds.studio },
    material: p.construction,
    ...(p.sizeCm ? { width: { "@type": "QuantitativeValue", value: p.sizeCm, unitCode: "CMT" }, height: { "@type": "QuantitativeValue", value: p.sizeCm, unitCode: "CMT" } } : {}),
    ...(priced.length
      ? {
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: "INR",
            lowPrice: Math.min(...prices).toFixed(2),
            highPrice: Math.max(...prices).toFixed(2),
            offerCount: priced.length,
            availability: "https://schema.org/MadeToOrder",
            seller: { "@id": jsonLdIds.studio },
            url: absolute(`/shop/${p.slug}`),
          },
        }
      : {}),
  };
}

export function graph(...nodes: (Json | null | undefined)[]) {
  return { "@context": "https://schema.org", "@graph": nodes.filter(Boolean) };
}
