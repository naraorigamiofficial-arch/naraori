import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { Marked, type Tokens } from "marked";
import { mediaSize, optimisedSrcSet } from "./media";

export interface TocEntry {
  id: string;
  text: string;
}

const slugify = (s: string) =>
  s.toLowerCase().replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const escAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

export function renderMarkdown(src: string) {
  const toc: TocEntry[] = [];
  const marked = new Marked({ gfm: true });
  marked.use({
    renderer: {
      heading(this: { parser: { parseInline: (t: Tokens.Generic[]) => string } }, { tokens, depth }: Tokens.Heading) {
        const html = this.parser.parseInline(tokens);
        const id = slugify(html);
        if (depth === 2) toc.push({ id, text: html.replace(/<[^>]+>/g, "") });
        const level = Math.min(depth + 0, 4);
        return `<h${level} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true" tabindex="-1">§</a>${html}</h${level}>`;
      },
      image({ href, title, text }: Tokens.Image) {
        const size = mediaSize(href);
        const dims = size ? ` width="${size.width}" height="${size.height}"` : "";
        const srcset = href.startsWith("/media/") ? ` srcset="${optimisedSrcSet(href)}" sizes="(min-width: 900px) 720px, 100vw"` : "";
        const fallback = href.startsWith("/media/") ? `/_next/image?url=${encodeURIComponent(href)}&w=1080&q=82` : href;
        const cap = title ? `<figcaption>${escAttr(title)}</figcaption>` : "";
        return `<figure class="prose-figure"><a href="${escAttr(href)}" class="zoomable" data-zoom><img src="${fallback}"${srcset} alt="${escAttr(text)}"${dims} loading="lazy" decoding="async"></a>${cap}</figure>`;
      },
      table(this: unknown, token: Tokens.Table) {
        const head = token.header.map((c) => `<th scope="col">${marked.parseInline(c.text)}</th>`).join("");
        const body = token.rows.map((r) => `<tr>${r.map((c) => `<td>${marked.parseInline(c.text)}</td>`).join("")}</tr>`).join("");
        return `<div class="table-scroll" tabindex="0" role="region" aria-label="Table"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
      },
    },
  });
  const html = marked.parse(src, { async: false }) as string;
  // Paragraph-wrapped figures are invalid HTML; unwrap them.
  return { html: html.replace(/<p>(<figure[\s\S]*?<\/figure>)<\/p>/g, "$1"), toc };
}

export interface Doc<F> {
  slug: string;
  frontmatter: F;
  html: string;
  toc: TocEntry[];
  readingMinutes: number;
}

export async function loadCollection<F extends { state: string }>(dir: string): Promise<Doc<F>[]> {
  const root = path.join(process.cwd(), "content", dir);
  const files = (await fs.readdir(root)).filter((f) => f.endsWith(".md"));
  const docs = await Promise.all(
    files.map(async (file) => {
      const raw = await fs.readFile(path.join(root, file), "utf8");
      const { data, content } = matter(raw);
      const { html, toc } = renderMarkdown(content);
      const words = content.split(/\s+/).filter(Boolean).length;
      return { slug: file.replace(/\.md$/, ""), frontmatter: data as F, html, toc, readingMinutes: Math.max(1, Math.round(words / 220)) };
    }),
  );
  return docs;
}
