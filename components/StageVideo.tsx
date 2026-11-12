"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { stageVideo as sv } from "@/content/stage-video";

/**
 * The homepage opening: the real studio film plays at its filmed speed while the stage is in
 * view and pauses when the visitor scrolls away. It plays once and rests on its last frame;
 * coming back after it has finished plays it again.
 *
 * - The file is only fetched when the stage is near the viewport (small file on phones).
 * - Reduced motion: never plays by itself; a Play button is offered.
 * - No JavaScript: the poster still is shown.
 */
export function StageVideo({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  const stage = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const degrees = useRef<HTMLSpanElement>(null);
  const [src, setSrc] = useState<"large" | "small" | null>(null);
  const [reduced, setReduced] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const st = stage.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Decided on the client; the server renders the still poster.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduced(reduce);
    const pick = window.innerWidth * Math.min(window.devicePixelRatio || 1, 2) > 1100 ? "large" : "small";
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          // Start fetching once the stage is close; play only when at least half of it is visible.
          if (e.isIntersecting) setSrc((s) => s ?? pick);
          const visible = e.intersectionRatio >= 0.5;
          const v = video.current;
          if (!v || reduce) continue;
          if (visible) {
            if (v.ended) v.currentTime = 0;
            v.play().catch(() => undefined);
          } else v.pause();
        }
      },
      { threshold: [0, 0.5], rootMargin: "200px 0px" },
    );
    io.observe(st);
    return () => io.disconnect();
  }, []);

  // Progress line and degree counter follow the film (one full turn over its length).
  useEffect(() => {
    const v = video.current;
    const st = stage.current;
    if (!v || !st) return;
    let raf = 0;
    const update = () => {
      const p = v.duration ? Math.min(1, v.currentTime / v.duration) : 0;
      st.style.setProperty("--p", p.toFixed(3));
      if (degrees.current) degrees.current.textContent = `${String(Math.round(p * 360)).padStart(3, "0")}°`;
      if (!v.paused && !v.ended) raf = requestAnimationFrame(update);
    };
    const onPlay = () => {
      setPlaying(true);
      st.dataset.playing = "1";
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    const onStop = () => {
      setPlaying(false);
      delete st.dataset.playing;
      update();
    };
    const onCanPlay = () => {
      st.dataset.ready = "1";
      if (!reduced && st.getBoundingClientRect().top < window.innerHeight * 0.5) v.play().catch(() => undefined);
    };
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onStop);
    v.addEventListener("ended", onStop);
    v.addEventListener("seeked", update);
    v.addEventListener("canplay", onCanPlay);
    return () => {
      cancelAnimationFrame(raf);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onStop);
      v.removeEventListener("ended", onStop);
      v.removeEventListener("seeked", update);
      v.removeEventListener("canplay", onCanPlay);
    };
  }, [src, reduced]);

  const toggle = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused || v.ended) {
      if (v.ended) v.currentTime = 0;
      v.play().catch(() => undefined);
    } else v.pause();
  };

  return (
    <div ref={stage} className="sv-stage">
      <div className="sv-media">
        {/* eslint-disable-next-line @next/next/no-img-element -- poster still; the film fades in over it */}
        <img
          className="sv-poster"
          src={sv.poster.large}
          srcSet={`${sv.poster.small} 720w, ${sv.poster.large} 1280w`}
          sizes="(min-width: 761px) 72vw, 140vw"
          width={sv.width}
          height={sv.height}
          alt={sv.alt}
          fetchPriority="high"
        />
        {src && (
          <video
            ref={video}
            className="sv-video"
            poster={sv.poster.large}
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
            tabIndex={-1}
            disablePictureInPicture
          >
            {sv.sources[src].map((x) => (
              <source key={x.src} src={x.src} type={x.type} />
            ))}
          </video>
        )}
      </div>
      <div className="sv-vignette" aria-hidden="true" />
      <div className="sv-content">{children}</div>
      <div className="sv-meter">
        <Link href={sv.href} className="sv-title">{sv.title}</Link>
        <span className="sv-label">{sv.label}</span>
        <span ref={degrees} className="sv-deg" aria-hidden="true">000°</span>
      </div>
      {src && (
        <button type="button" className="sv-toggle" onClick={toggle} aria-label={playing ? "Pause the film" : "Play the film"}>
          {playing ? "Pause" : reduced ? "Play film" : "Play"}
        </button>
      )}
      <div className="sv-line" aria-hidden="true" />
      {footer && <div className="sv-footer">{footer}</div>}
    </div>
  );
}
