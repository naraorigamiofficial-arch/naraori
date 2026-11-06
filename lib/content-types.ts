export type PublishState = "published" | "draft";

export interface MediaImage {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption?: string;
  credit?: string; // photographer / rights holder
}

/** A fact that is either known, or explicitly not yet documented. Never guessed. */
export type Fact<T = string> = T | null;

export interface StoryLayer {
  /** Fixed order: finished → concept → prototypes → structure → materials */
  key: "sculpture" | "concept" | "prototypes" | "structure" | "materials";
  title: string;
  body: string[];
  images?: MediaImage[];
}

export interface Artwork {
  slug: string;
  state: PublishState;
  catalogueNo: string;
  title: string;
  alternateTitle?: string;
  subject: string;
  category: "Historical & mythological figures" | "Characters & warriors" | "Creatures" | "Studies";
  year: Fact<number>;
  /** The artist's own short caption. */
  intro: string;
  /** Mount-board colour behind the transparent sculpture photograph. */
  field: string;
  image: MediaImage | null;
  details: MediaImage[];
  technical: {
    sheetShape: Fact;
    sheetSize: Fact;
    grid: Fact;
    paper: Fact;
    sheets: Fact<number>;
    cutsOrGlue: Fact;
    finishedSize: Fact;
    method: Fact;
  };
  story: StoryLayer[];
  process?: { title: string; note: string; detail: string; image: MediaImage }[];
  availability: Fact<"In the artist's collection" | "Available for acquisition" | "Private collection">;
  relatedArticles?: string[];
  relatedProjects?: string[];
  /** Internal: what still needs to be confirmed by the owner. Never rendered publicly. */
  todo?: string[];
}

export interface StudioProject {
  slug: string;
  state: PublishState;
  title: string;
  status: "Idea" | "In development" | "Active" | "Paused" | "Completed";
  startedOn: Fact;
  tags: string[];
  summary: string[];
  sections: { heading: string; body: string[] }[];
  image: MediaImage | null;
  relatedArtwork?: string;
}
