import Image from "next/image";
import Link from "next/link";
import { ViewTransition, type CSSProperties } from "react";
import type { Artwork } from "@/lib/content-types";

interface Props {
  artwork: Artwork;
  /** Aspect of the mount field, e.g. "4 / 5". The sculpture is contained within it. */
  aspect?: string;
  sizes: string;
  priority?: boolean;
  /** "link" → goes to the Fold File; "zoom" → opens the full-resolution viewer. */
  action?: "link" | "zoom" | "none";
  caption?: "inside" | "none";
  className?: string;
  /** "cover" crops empty transparent margin, for sculptures whose photo has lots of space around them. */
  fit?: "contain" | "cover";
}

export function ArtworkMount({ artwork: a, aspect = "1 / 1", sizes, priority, action = "link", caption = "inside", className, fit = "contain" }: Props) {
  const style = { "--field": a.field, aspectRatio: aspect } as CSSProperties;
  const img = a.image ? (
    <ViewTransition name={`art-${a.slug}`} share="morph" default="none">
      <Image src={a.image.src} alt={a.image.alt} width={a.image.width} height={a.image.height} sizes={sizes} preload={priority} fetchPriority={priority ? "high" : undefined} loading={priority ? "eager" : undefined} quality={82} />
    </ViewTransition>
  ) : (
    <div className="placeholder-plate" style={{ height: "100%" }}>
      Artwork photograph required
    </div>
  );

  const body =
    action === "link" ? (
      <Link href={`/artworks/${a.slug}`} className="mount-hit" aria-label={`${a.title}${a.alternateTitle ? ` (${a.alternateTitle})` : ""}, view the Fold File`}>
        {img}
      </Link>
    ) : action === "zoom" && a.image ? (
      <a href={a.image.src} data-zoom data-caption={a.image.alt} className="mount-hit zoomable" aria-label={`Open full-resolution photograph of ${a.title}`}>
        {img}
      </a>
    ) : (
      img
    );

  return (
    <div className={`mount mount-${fit} ${className ?? ""}`} style={style}>
      {body}
      {caption === "inside" && (
        <p className="mount-caption mount-caption-edge" aria-hidden={action === "link" ? "true" : undefined}>
          <b>{a.catalogueNo}</b> · {a.technical.sheetSize ?? "Sheet size not yet documented"}
          {a.technical.grid ? ` · ${a.technical.grid}` : ""}
        </p>
      )}
    </div>
  );
}
