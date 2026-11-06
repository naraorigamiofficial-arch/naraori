import { describe, expect, it } from "vitest";
import { artworks, publishedArtworks } from "@/content/artworks";
import { products } from "@/content/catalogue";
import { projects } from "@/content/projects";
import { renderMarkdown } from "@/lib/markdown";

describe("content integrity", () => {
  it("never publishes an artwork without a photograph", () => {
    for (const a of publishedArtworks()) expect(a.image, a.slug).not.toBeNull();
  });
  it("keeps drafts out of the public list", () => {
    const drafts = artworks.filter((a) => a.state === "draft").map((a) => a.slug);
    expect(publishedArtworks().some((a) => drafts.includes(a.slug))).toBe(false);
  });
  it("has unique slugs and SKUs", () => {
    const slugs = [...artworks.map((a) => a.slug), ...projects.map((p) => p.slug), ...products.map((p) => p.slug)];
    expect(new Set(slugs).size).toBe(slugs.length);
    const skus = products.flatMap((p) => p.options.map((o) => o.sku));
    expect(new Set(skus).size).toBe(skus.length);
    for (const s of skus) expect(s).toMatch(/^[a-z0-9-]{1,64}$/);
  });
  it("uses integer paise and sane MOQs", () => {
    for (const p of products)
      for (const o of p.options) {
        expect(Number.isInteger(o.unitPrice)).toBe(true);
        expect(o.minUnits).toBeGreaterThanOrEqual(1);
        expect(o.minUnits).toBeLessThanOrEqual(o.maxUnits);
      }
  });
  it("contains no em dashes in any public copy", () => {
    const text = JSON.stringify([artworks, projects, products]);
    expect(text.includes(String.fromCharCode(0x2014))).toBe(false);
  });
  it("renders markdown headings with anchors and images with dimensions", () => {
    const { html, toc } = renderMarkdown("## Hello world\n\n![Alt text](/media/process/sun-wukong-step-1.jpg \"Cap\")");
    expect(toc).toEqual([{ id: "hello-world", text: "Hello world" }]);
    expect(html).toContain('width="4096" height="3072"');
    expect(html).toContain("<figcaption>Cap</figcaption>");
    expect(html).not.toMatch(/<p><figure/);
  });
});
