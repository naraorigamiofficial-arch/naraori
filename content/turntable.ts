/**
 * The scroll-driven turntable on the homepage.
 * Frames were extracted from the artist's own 360° turntable video (VID20260906033132.mp4).
 * TODO(owner): confirm which sculpture this is; set `title` (and `slug` once it has a Fold File).
 */
export const turntable = {
  title: null as string | null,
  label: "Horse and rider",
  slug: null as string | null,
  frames: 120,
  width: 1280,
  height: 720,
  src: (size: 720 | 1280, i: number) => `/media/turntable/${size}/${String(i + 1).padStart(3, "0")}.webp`,
  alt: "A white origami horse and rider on a dark studio table, photographed as it turns a full circle",
};
