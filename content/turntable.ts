/**
 * The scroll-driven turntable on the homepage.
 * Frames were extracted from the artist's own 360° turntable video (VID20260906033132.mp4).
 * Confirmed by the artist: the Chhatrapati Shivaji Maharaj re-design (work in progress).
 */
export const turntable = {
  title: "Chhatrapati Shivaji Maharaj" as string | null,
  label: "Re-design, in progress",
  /** Where the label links: the studio project page. */
  href: "/projects/chhatrapati-shivaji-maharaj-redesign" as string | null,
  frames: 180,
  width: 1280,
  height: 720,
  src: (size: 720 | 1280, i: number) => `/media/turntable/${size}/${String(i + 1).padStart(3, "0")}.webp`,
  alt: "Chhatrapati Shivaji Maharaj (re-design, in progress): a white origami horse and rider on a dark studio table, photographed as it turns a full circle",
};
