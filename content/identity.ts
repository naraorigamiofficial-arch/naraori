/**
 * THE single source of truth for names, roles and official links.
 * Every page, email, metadata tag and JSON-LD block reads from here.
 * Do not hard-code these strings elsewhere.
 *
 * Anything marked `verified: false` is NOT shown publicly until the owner confirms it.
 */

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://naraori.in").replace(/\/$/, "");

export const identity = {
  person: {
    name: "Abhijeet S. Vashistha",
    // Verified alternate forms people may search for. Used only in JSON-LD `alternateName`.
    alternateNames: ["Abhijeet Vashistha", "Nara"],
    // Older name used in some contexts. Kept OFF the public site until the owner confirms
    // which older works/profiles it connects to.
    legacyName: { value: "Shang Nara", verified: false },
    jobTitle: "Origami artist and designer",
    nationality: "Indian",
    portrait: {
      src: "/media/studio/abhijeet-s-vashistha-portrait.webp",
      width: 1219,
      height: 1290,
      alt: "Portrait of Abhijeet S. Vashistha, origami artist, in a dark suit and red tie",
    },
  },
  artistName: "Nara Origami",
  studio: {
    name: "Nara Origami Originals",
    description:
      "The studio and paper atelier of origami artist Abhijeet S. Vashistha, producing hand-treated, large-format double-tissue paper for origami artists in India and abroad.",
  },
  sioa: {
    name: "Society of Indian Origami Artists",
    shortName: "SIOA",
    // Wording taken from the artist's own previous About text.
    role: "Administrator and developer",
    // TODO(owner): official SIOA website URL. Left null so we never link to a guess.
    url: null as string | null,
  },
  contact: {
    // Already published by the artist on the previous site.
    email: process.env.NEXT_PUBLIC_STUDIO_EMAIL ?? "naraorigami.official@gmail.com",
    location: "India", // Country only, never a residential address.
  },
  /**
   * Official profiles. Only add URLs the owner has confirmed. These become `sameAs` in JSON-LD
   * and the links on /about and /press. Empty entries are ignored.
   */
  profiles: [
    // { label: "Instagram", url: "https://www.instagram.com/<handle>/" },
    // { label: "YouTube", url: "https://www.youtube.com/@<handle>" },
  ] as { label: string; url: string }[],
  /** Approved positioning line (see brief, no unverified "first in India" claim). */
  positioning:
    "A pioneering independent studio making large-format, treated double-tissue paper accessible to origami artists in India.",
} as const;

export const jsonLdIds = {
  person: `${SITE_URL}/#person`,
  studio: `${SITE_URL}/#studio`,
  website: `${SITE_URL}/#website`,
  sioa: `${SITE_URL}/#sioa`,
};
