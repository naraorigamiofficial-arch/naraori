import type { Artwork } from "@/lib/content-types";

/** Museum-label caption: title, alternate title, subject and the key making facts. */
export function ArchivalCaption({ artwork: a, as: Tag = "h3" }: { artwork: Artwork; as?: "h2" | "h3" }) {
  return (
    <div className="archival">
      <span className="meta">
        {a.catalogueNo}
        {a.year ? ` · ${a.year}` : ""} · {a.category}
      </span>
      <Tag className="archival-title">{a.title}</Tag>
      {a.alternateTitle && <p className="archival-alt">{a.alternateTitle}</p>}
      <p className="archival-intro">{a.intro}</p>
    </div>
  );
}
