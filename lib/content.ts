import "server-only";
import { cache } from "react";
import { loadCollection } from "./markdown";

export interface LearnFrontmatter {
  title: string;
  description: string;
  section: "Foundations" | "Design Systems" | "Materials and Folding" | "Design Studies";
  difficulty: string;
  prerequisites: string[];
  published: string;
  updated: string;
  state: "published" | "draft";
  calculator?: boolean;
  relatedArtworks?: string[];
  relatedProducts?: string[];
  relatedArticles?: string[];
}

export interface JournalFrontmatter {
  title: string;
  description: string;
  date: string;
  state: "published" | "draft";
  project?: string;
}

/** Drafts never leave this module: not rendered, not in sitemap, not in search. */
export const getLearn = cache(async () =>
  (await loadCollection<LearnFrontmatter>("learn"))
    .filter((d) => d.frontmatter.state === "published")
    .sort((a, b) => a.frontmatter.title.localeCompare(b.frontmatter.title)),
);

export const getJournal = cache(async () =>
  (await loadCollection<JournalFrontmatter>("journal"))
    .filter((d) => d.frontmatter.state === "published")
    .sort((a, b) => String(b.frontmatter.date).localeCompare(String(a.frontmatter.date))),
);

export const LEARN_SECTIONS = ["Foundations", "Design Systems", "Materials and Folding", "Design Studies"] as const;
