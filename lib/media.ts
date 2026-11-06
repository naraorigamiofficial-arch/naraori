import { artworks } from "@/content/artworks";

/** Known dimensions of every image in /public/media, so HTML can reserve space (no layout shift). */
const registry = new Map<string, { width: number; height: number }>();
for (const a of artworks) {
  if (a.image) registry.set(a.image.src, a.image);
  a.process?.forEach((p) => registry.set(p.image.src, p.image));
}
registry.set("/media/studio/crease-pattern.png", { width: 978, height: 984 });
registry.set("/media/studio/abhijeet-s-vashistha-portrait.webp", { width: 1219, height: 1290 });

export const mediaSize = (src: string) => registry.get(src);

const WIDTHS = [640, 828, 1080, 1200, 1920];
/** Build a srcset that goes through Next's image optimiser (AVIF/WebP, resized). */
export function optimisedSrcSet(src: string, max = 1920) {
  return WIDTHS.filter((w) => w <= max)
    .map((w) => `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=82 ${w}w`)
    .join(", ");
}

