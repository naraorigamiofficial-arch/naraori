import { ViewTransition, type ReactNode } from "react";

/**
 * Wraps each page's content so route changes play the "fold" transition (see globals.css).
 * Must be used in page.tsx files, not layouts: layouts persist, so enter/exit never fire there.
 */
export function Folio({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="fold" exit="fold" default="none">
      <div className="folio">{children}</div>
    </ViewTransition>
  );
}
