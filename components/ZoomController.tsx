"use client";

import { useEffect, useRef, useState } from "react";

/**
 * One accessible full-screen image viewer for the whole site.
 * Any <a data-zoom href="full.jpg"> becomes zoomable; without JavaScript the link simply opens the image.
 */
export function ZoomController() {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [img, setImg] = useState<{ src: string; alt: string; caption: string } | null>(null);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[data-zoom]");
      if (!a) return;
      e.preventDefault();
      const inner = a.querySelector("img");
      const caption = a.closest("figure")?.querySelector("figcaption")?.textContent ?? a.dataset.caption ?? "";
      opener.current = a;
      setZoomed(false);
      setImg({ src: a.getAttribute("href")!, alt: inner?.getAttribute("alt") ?? "", caption });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (img && dialog.current && !dialog.current.open) dialog.current.showModal();
  }, [img]);

  const close = () => {
    dialog.current?.close();
  };

  return (
    <dialog
      ref={dialog}
      className="zoom-dialog"
      aria-label={img ? `Image viewer: ${img.alt}` : "Image viewer"}
      onClose={() => {
        setImg(null);
        opener.current?.focus();
      }}
      onClick={(e) => e.target === dialog.current && close()}
    >
      {img && (
        <div className="zoom-inner">
          <div className="zoom-bar">
            <span>{zoomed ? "Actual size: scroll to explore" : "Fitted to screen"}</span>
            <span style={{ display: "flex", gap: "0.5rem" }}>
              <button type="button" onClick={() => setZoomed((z) => !z)} aria-pressed={zoomed}>
                {zoomed ? "Fit" : "Zoom"}
              </button>
              <button type="button" onClick={close} autoFocus>
                Close
              </button>
            </span>
          </div>
          <div className={`zoom-stage${zoomed ? " zoomed" : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- full-resolution original on purpose */}
            <img src={img.src} alt={img.alt} onClick={() => setZoomed((z) => !z)} />
          </div>
          {img.caption && <p className="zoom-caption">{img.caption}</p>}
        </div>
      )}
    </dialog>
  );
}
