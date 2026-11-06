import type { MetadataRoute } from "next";
import { publishedArtworks } from "@/content/artworks";
import { products } from "@/content/catalogue";
import { SITE_URL } from "@/content/identity";
import { publishedProjects } from "@/content/projects";
import { getJournal, getLearn } from "@/lib/content";

/**
 * Only published, indexable pages. Drafts, filters, the order sheet, confirmations,
 * search results and the studio dashboard are deliberately absent.
 * lastModified is only given where we know a real date.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [learn, journal] = await Promise.all([getLearn(), getJournal()]);
  const u = (p: string) => `${SITE_URL}${p}`;
  const staticPages = ["", "/artworks", "/projects", "/shop", "/learn", "/journal", "/about", "/commissions", "/press", "/contact", "/shipping", "/terms", "/privacy", "/accessibility"];
  return [
    ...staticPages.map((p) => ({ url: u(p || "/") })),
    ...publishedArtworks().map((a) => ({ url: u(`/artworks/${a.slug}`), images: a.image ? [u(a.image.src)] : undefined })),
    ...publishedProjects().map((p) => ({ url: u(`/projects/${p.slug}`) })),
    ...products.filter((p) => p.published).map((p) => ({ url: u(`/shop/${p.slug}`) })),
    ...learn.map((d) => ({ url: u(`/learn/${d.slug}`), lastModified: d.frontmatter.updated || d.frontmatter.published })),
    ...journal.map((d) => ({ url: u(`/journal/${d.slug}`), lastModified: d.frontmatter.date })),
  ];
}
