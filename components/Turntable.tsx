"use client";

import Link from "next/link";
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
    const tr = track.current!;
    const ctx = cv.getContext("2d", { alpha: false });
    if (!ctx) return;
    ctx.imageSmoothingQuality = "high";

    const N = tt.frames;
    const size: 720 | 1280 = window.innerWidth * Math.min(window.devicePixelRatio || 1, 2) > 1100 ? 1280 : 720;
    const frames: (HTMLImageElement | null)[] = new Array(N).fill(null);
    let bg = "#11100f";
    let target = 0;
    let current = 0;
    let lastDrawn = -1; // fractional frame position last painted
    let lastDeg = -1;
    let raf = 0;
    let lastT = 0;
    let disposed = false;

    // ---- Geometry, measured on resize only (never during scrolling) ----
    let box = { x: 0, y: 0, w: 0, h: 0 };
    let trackTop = 0;
    let span = 1;
    let stickTop = 0;
    const overlay = document.createElement("canvas"); // feathered frame edges, drawn once per resize

    const measure = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const r = st.getBoundingClientRect();
      cv.width = Math.min(2400, Math.round(r.width * dpr));
      cv.height = Math.round((cv.width / r.width) * r.height);
      const cw = cv.width;
      const ch = cv.height;
      const wide = cw / ch > 1.25;
      // Fit so the central 72% of the frame (where the sculpture turns) is always visible.
      const s = Math.min(cw / (tt.width * 0.72), ch / tt.height) * (wide ? 1.04 : 1.12);
      const w = tt.width * s;
      const h = tt.height * s;
      // Wide screens: sculpture right of centre, leaving the left for the name.
      box = { w, h, x: (wide ? cw * 0.6 : cw / 2) - w / 2, y: wide ? (ch - h) / 2 + ch * 0.02 : (ch - h) / 2 - ch * 0.1 };
      overlay.width = cw;
      overlay.height = ch;
      paintOverlay();
      stickTop = parseFloat(getComputedStyle(st).top) || 0;
      trackTop = tr.getBoundingClientRect().top + window.scrollY;
      span = Math.max(1, tr.offsetHeight - st.offsetHeight);
      lastDrawn = -1;
    };

    const paintOverlay = () => {
      const o = overlay.getContext("2d")!;
      o.clearRect(0, 0, overlay.width, overlay.height);
      const { x, y, w, h } = box;
      const edge = (x0: number, y0: number, x1: number, y1: number) => {
        const g = o.createLinearGradient(x0, y0, x1, y1);
        g.addColorStop(0, bg);
        g.addColorStop(1, "rgba(0,0,0,0)");
        return g;
      };
      const fy = h * 0.16;
      const fx = w * 0.12;
      o.fillStyle = edge(0, y, 0, y + fy); o.fillRect(x, y, w, fy);
      o.fillStyle = edge(0, y + h, 0, y + h - fy); o.fillRect(x, y + h - fy, w, fy);
      o.fillStyle = edge(x, 0, x + fx, 0); o.fillRect(x, y, fx, h);
      o.fillStyle = edge(x + w, 0, x + w - fx, 0); o.fillRect(x + w - fx, y, fx, h);
    };

    // The video's own backdrop colour, so frame edges and stage are one surface.
    const sampleBackground = (img: HTMLImageElement) => {
      try {
        const c = document.createElement("canvas");
        c.width = 32;
        c.height = 18;
        const x = c.getContext("2d")!;
        x.drawImage(img, 0, 0, 32, 18);
        const d = x.getImageData(0, 0, 32, 3).data;
        let r = 0, g = 0, b = 0;
        for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
        const n = d.length / 4;
        bg = `rgb(${Math.round(r / n)}, ${Math.round(g / n)}, ${Math.round(b / n)})`;
        st.style.setProperty("--stage-bg", bg);
        paintOverlay();
      } catch {
        /* keep default */
      }
    };

    // A loaded frame within `reach` of i, or null (never jump far while frames are loading).
    const near = (i: number, reach: number) => {
      for (let d = 0; d <= reach; d++) {
        const a = frames[Math.min(N - 1, i + d)];
        if (a) return a;
        const b = frames[Math.max(0, i - d)];
        if (b) return b;
      }
      return null;
    };

    const paint = (pos: number) => {
      const i0 = Math.floor(pos);
      const f = pos - i0;
      const A = frames[i0];
      const B = frames[Math.min(N - 1, i0 + 1)];
      const { x, y, w, h } = box;
      if (A && B) {
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, cv.width, cv.height);
        // Blend neighbouring frames: continuous motion between the 2-degree steps.
        ctx.globalAlpha = 1;
        ctx.drawImage(A, x, y, w, h);
        if (f > 0.02 && B !== A) {
          ctx.globalAlpha = f;
          ctx.drawImage(B, x, y, w, h);
          ctx.globalAlpha = 1;
        }
      } else {
        const img = near(Math.round(pos), 3);
        if (!img) return false;
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, cv.width, cv.height);
        ctx.drawImage(img, x, y, w, h);
      }
      ctx.drawImage(overlay, 0, 0);
      if (!cv.dataset.ready) cv.dataset.ready = "1";
      return true;
    };

    const readTarget = () =>
      mode === "scroll"
        ? Math.min(1, Math.max(0, (window.scrollY + stickTop - trackTop) / span)) * (N - 1)
        : manual.current * (N - 1);

    const tick = (t: number) => {
      raf = 0;
      if (disposed) return;
      target = readTarget();
      const dt = lastT ? Math.min(64, t - lastT) : 16;
      lastT = t;
      // Time-based easing: same feel on 60 Hz and 120 Hz screens.
      const k = 1 - Math.exp(-dt / (mode === "scroll" ? 110 : 60));
      current += (target - current) * k;
      if (Math.abs(target - current) < 0.003) current = target;
      if (Math.abs(current - lastDrawn) > 0.004 && paint(current)) lastDrawn = current;
      const p = current / (N - 1);
      st.style.setProperty("--p", p.toFixed(3));
      const deg = Math.round(p * 360);
      if (deg !== lastDeg && degrees.current) {
        degrees.current.textContent = `${String(deg).padStart(3, "0")}°`;
        lastDeg = deg;
      }
      if (current !== target || lastDrawn !== current) raf = requestAnimationFrame(tick);
      else lastT = 0;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    // Loading: every 4th frame first (gaps of at most 8 degrees), then every 2nd, then all.
    const order: number[] = [];
    const seen = new Set<number>();
    for (const step of [4, 2, 1]) for (let i = 0; i < N; i += step) if (!seen.has(i)) { seen.add(i); order.push(i); }
    let next = 0;
    const worker = async () => {
      while (!disposed && next < order.length) {
        const i = order[next++];
        const img = new Image();
        img.decoding = "async";
        img.src = tt.src(size, i);
        try {
          await img.decode();
          if (i === 0) sampleBackground(img);
          frames[i] = img;
          if (Math.abs(i - current) < 4) {
            lastDrawn = -1;
            schedule();
          }
        } catch {
          /* skip a frame that fails to load */
        }
      }
    };
    for (let k = 0; k < 6; k++) void worker();

    measure();
    let lastW = window.innerWidth;
    let lastH = window.innerHeight;
    const onResize = () => {
      // Mobile address bars change the height while scrolling: only re-measure scroll positions
      // for that, and rebuild the canvas only for real size changes (no mid-scroll hitch).
      const big = window.innerWidth !== lastW || Math.abs(window.innerHeight - lastH) > 160;
      if (big) {
        lastW = window.innerWidth;
        lastH = window.innerHeight;
        measure();
      } else {
        trackTop = tr.getBoundingClientRect().top + window.scrollY;
        span = Math.max(1, tr.offsetHeight - st.offsetHeight);
      }
      schedule();
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(tr);
    const onManual = () => schedule();
    st.addEventListener("tt-manual", onManual);
    schedule();
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
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
        <div className="tt-meter">
          {tt.title && (tt.href ? <Link href={tt.href} className="tt-title">{tt.title}</Link> : <span className="tt-title">{tt.title}</span>)}
          <span className="tt-label">{tt.label}</span>
          <span ref={degrees} className="tt-deg" aria-hidden="true">000°</span>
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
