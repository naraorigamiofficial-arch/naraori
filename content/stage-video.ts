/**
 * The homepage opening film: the artist's own 360-degree studio video (VID20260906033132.mp4),
 * re-encoded (VP9 WebM and H.264 MP4) without sound, at the original frame rate.
 * Confirmed by the artist: the Chhatrapati Shivaji Maharaj re-design (work in progress).
 */
export const stageVideo = {
  title: "Chhatrapati Shivaji Maharaj",
  label: "Re-design, in progress",
  href: "/projects/chhatrapati-shivaji-maharaj-redesign",
  /** WebM (VP9) first, MP4 (H.264) for browsers without VP9, e.g. older Safari. */
  sources: {
    large: [{ src: "/media/video/shivaji-1280.webm", type: "video/webm" }, { src: "/media/video/shivaji-1280.mp4", type: "video/mp4" }],
    small: [{ src: "/media/video/shivaji-854.webm", type: "video/webm" }, { src: "/media/video/shivaji-854.mp4", type: "video/mp4" }],
  },
  poster: { large: "/media/studio/shivaji-redesign-poster-1280.webp", small: "/media/studio/shivaji-redesign-poster-720.webp" },
  width: 1280,
  height: 720,
  alt: "Chhatrapati Shivaji Maharaj (re-design, in progress): a white origami horse and rider on a dark studio table, turning a full circle",
};
