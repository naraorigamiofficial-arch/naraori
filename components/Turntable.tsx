"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { turntable as tt } from "@/content/turntable";

/**
 * Scroll-driven turntable. The visitor's scroll position chooses the frame, so the sculpture
 * turns only while they scroll, and eases to a stop when they stop. Frames are stills drawn
 * on a canvas (smooth seeking in every browser, unlike seeking inside a video file).
 *
 * - Without JavaScript: a still photograph (the server-rendered poster).
 * - With reduced motion: no scroll coupling; a slider turns the sculpture instead.
 */
export function Turntable({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const degrees = useRef<HTMLSpanElement>(null);
  const [mode, setMode] = useState<"static" | "scroll" | "manual">("static");
  const manual = useRef(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Decide the mode once on the client; the server always renders the static fallback.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMode(reduce ? "manual" : "scroll");
  }, []);

  useEffect(() => {
    if (mode === "static") return;
    const cv = canvas.current!;
    const st = stage.current!;
    const ctx = cv.getContext("2d", { alpha: false });
    if (!ctx) return;

    const size: 720 | 1280 = window.innerWidth * Math.min(window.devicePixelRatio || 1, 2) > 1100 ? 1280 : 720;
    const frames: (HTMLImageElement | null)[] = new Array(tt.frames).fill(null);
    let target = 0;
    let current = 0;
    let drawn = -1;
    let raf = 0;
    let disposed = false;

    const nearestLoaded = (i: number) => {
      for (let d = 0; d < tt.frames; d++) {
        const a = frames[(i + d) % tt.frames];
        if (a) return a;
        const b = frames[(i - d + tt.frames) % tt.frames];
        if (b) return b;
      }
      return null;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = st.getBoundingClientRect();
      cv.width = Math.round(r.width * dpr);
      cv.height = Math.round(r.height * dpr);
      drawn = -1;
    };

    // The video's own backdrop colour, sampled from the first frame, so the stage and the
    // frame edges blend into one surface.
    let bg = "#121110";
    const sampleBackground = (img: HTMLImageElement) => {
      try {
        const c = document.createElement("canvas");
        c.width = 32;
        c.height = 18;
        const x = c.getContext("2d")!;
        x.drawImage(img, 0, 0, 32, 18);
        const d = x.getImageData(0, 0, 32, 3).data; // top rows: backdrop cloth only
        let r = 0, g = 0, b = 0;
        for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
        const n = d.length / 4;
        bg = `rgb(${Math.round(r / n)}, ${Math.round(g / n)}, ${Math.round(b / n)})`;
        st.style.setProperty("--stage-bg", bg);
      } catch {
        /* keep default */
      }
    };

    const feather = (x: number, y: number, w: number, h: number) => {
      const edge = (x0: number, y0: number, x1: number, y1: number) => {
        const g = ctx.createLinearGradient(x0, y0, x1, y1);
        g.addColorStop(0, bg);
        g.addColorStop(1, "rgba(0,0,0,0)");
        return g;
      };
      const fy = h * 0.16;
      const fx = w * 0.12;
      ctx.fillStyle = edge(0, y, 0, y + fy); ctx.fillRect(x, y, w, fy);
      ctx.fillStyle = edge(0, y + h, 0, y + h - fy); ctx.fillRect(x, y + h - fy, w, fy);
      ctx.fillStyle = edge(x, 0, x + fx, 0); ctx.fillRect(x, y, fx, h);
      ctx.fillStyle = edge(x + w, 0, x + w - fx, 0); ctx.fillRect(x + w - fx, y, fx, h);
    };

    const draw = (index: number) => {
      const img = nearestLoaded(index);
      if (!img) return;
      const cw = cv.width;
      const ch = cv.height;
      const wide = cw / ch > 1.25;
      // Fit so the central 72% of the frame (where the sculpture turns) is always visible.
      const s = Math.min(cw / (tt.width * 0.72), ch / tt.height) * (wide ? 1.04 : 1.12);
      const w = tt.width * s;
      const h = tt.height * s;
      // Wide screens: sculpture right of centre, leaving the left for the name.
      const x = (wide ? cw * 0.6 : cw / 2) - w / 2;
      const y = (wide ? (ch - h) / 2 + ch * 0.02 : (ch - h) / 2 - ch * 0.1);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, cw, ch);
      ctx.drawImage(img, x, y, w, h);
      feather(x, y, w, h);
      cv.dataset.ready = "1";
    };

    const progress = () => {
      const t = track.current!;
      const r = t.getBoundingClientRect();
      const stageH = st.offsetHeight;
      const span = Math.max(1, r.height - stageH);
      return Math.min(1, Math.max(0, (st.getBoundingClientRect().top - r.top) / span));
    };

    const tick = () => {
      raf = 0;
      if (disposed) return;
      if (mode === "scroll") target = progress() * (tt.frames - 1);
      else target = manual.current * (tt.frames - 1);
      // Ease toward the target: gives the turn a weight, like a real turntable.
      current += (target - current) * (mode === "scroll" ? 0.16 : 0.35);
      if (Math.abs(target - current) < 0.02) current = target;
      const index = Math.round(current);
      if (index !== drawn) {
        draw(index);
        drawn = index;
      }
      const p = current / (tt.frames - 1);
      st.style.setProperty("--p", p.toFixed(4));
      if (degrees.current) degrees.current.textContent = `${String(Math.round(p * 360)).padStart(3, "0")}°`;
      if (current !== target) raf = requestAnimationFrame(tick);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    // Progressive loading: every 8th frame first, then fill the gaps. Starts only when near.
    let started = false;
    const load = () => {
      if (started) return;
      started = true;
      const order: number[] = [];
      for (const step of [8, 4, 2, 1]) for (let i = 0; i < tt.frames; i += step) if (!order.includes(i)) order.push(i);
      let next = 0;
      const worker = async () => {
        while (!disposed && next < order.length) {
          const i = order[next++];
          const img = new Image();
          img.src = tt.src(size, i);
          try {
            await img.decode();
            if (i === 0) sampleBackground(img);
            frames[i] = img;
            if (Math.abs(i - Math.round(current)) < 4 || drawn === -1) {
              drawn = -1;
              schedule();
            }
          } catch {
            /* skip a frame that fails to load */
          }
        }
      };
      for (let k = 0; k < 4; k++) void worker();
    };
    const io = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && load(), { rootMargin: "600px" });
    io.observe(track.current!);

    resize();
    const onResize = () => {
      resize();
      schedule();
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", onResize);
    const onManual = () => schedule();
    st.addEventListener("tt-manual", onManual);
    schedule();
    return () => {
      disposed = true;
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
      st.removeEventListener("tt-manual", onManual);
    };
  }, [mode]);

  return (
    <div ref={track} className={`tt-track tt-${mode}`}>
      <div ref={stage} className="tt-stage">
        {/* Poster: shown immediately (and without JavaScript); the canvas paints over it. */}
        {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized still from the frame set */}
        <img
          className="tt-poster"
          src={tt.src(1280, 0)}
          srcSet={`${tt.src(720, 0)} 720w, ${tt.src(1280, 0)} 1280w`}
          sizes="100vw"
          width={tt.width}
          height={tt.height}
          alt={tt.alt}
          fetchPriority="high"
        />
        <canvas ref={canvas} className="tt-canvas" aria-hidden="true" />
        <div className="tt-vignette" aria-hidden="true" />
        <div className="tt-content">{children}</div>
        <div className="tt-meter" aria-hidden={mode === "manual" ? undefined : "true"}>
          <span className="tt-label">{tt.title ?? tt.label}</span>
          <span ref={degrees} className="tt-deg">000°</span>
        </div>
        {mode === "scroll" && (
          <p className="tt-hint" aria-hidden="true">
            Scroll to turn
          </p>
        )}
        {mode === "manual" && (
          <label className="tt-range">
            <span>Turn the sculpture</span>
            <input
              type="range"
              min={0}
              max={359}
              defaultValue={0}
              onChange={(e) => {
                manual.current = Number(e.target.value) / 359;
                stage.current?.dispatchEvent(new Event("tt-manual"));
              }}
            />
          </label>
        )}
        <div className="tt-line" aria-hidden="true" />
        {footer && <div className="tt-footer">{footer}</div>}
      </div>
    </div>
  );
}
