import type { CSSProperties } from "react";

/**
 * Proportional sheet comparison. All squares share the bottom-left corner, like sheets
 * stacked on a table. 1 SVG unit = 1 cm, so proportions are exact; the drawing is NOT
 * shown at physical size on screen (stated in the caption).
 */
export interface DiagramSheet {
  cm: number;
  label: string;
}

const MAX = 150;
const PAD = 12;
const A4 = { w: 21, h: 29.7 };

export function SheetDiagram({
  sheets,
  selectedCm,
  title = "Sheet sizes compared to an A4 page",
  showA4 = true,
  className,
}: {
  sheets: DiagramSheet[];
  selectedCm?: number | null;
  title?: string;
  showA4?: boolean;
  className?: string;
}) {
  const W = PAD + MAX + (showA4 ? 34 : 6);
  const H = PAD + MAX + 22;
  const base = PAD + MAX; // y of the shared bottom edge
  const x0 = PAD;
  const labelled = new Set([25, 50, 70, 100, 150]);
  const scale = selectedCm ? selectedCm / MAX : 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby="sheet-diagram-title sheet-diagram-desc" className={`sheet-diagram ${className ?? ""}`}>
      <title id="sheet-diagram-title">{title}</title>
      <desc id="sheet-diagram-desc">
        {`Squares drawn to scale, sharing one corner: ${sheets.map((s) => s.label).join(", ")}${showA4 ? ", beside an A4 page (21 × 29.7 cm) for reference" : ""}.${selectedCm ? ` Highlighted: ${selectedCm} cm.` : ""}`}
      </desc>
      {/* faint 10 cm grid, like a cutting mat */}
      <g className="sd-grid">
        {Array.from({ length: MAX / 10 + 1 }, (_, i) => (
          <g key={i}>
            <line x1={x0 + i * 10} y1={base} x2={x0 + i * 10} y2={base - MAX} />
            <line x1={x0} y1={base - i * 10} x2={x0 + MAX} y2={base - i * 10} />
          </g>
        ))}
      </g>
      {/* the selected sheet expands from the shared corner */}
      <rect
        className="sd-selected"
        x={x0}
        y={base - MAX}
        width={MAX}
        height={MAX}
        style={{ transform: `scale(${scale})`, transformOrigin: `${x0}px ${base}px` } as CSSProperties}
      />
      {sheets
        .slice()
        .sort((a, b) => b.cm - a.cm)
        .map((s) => (
          <g key={s.cm} className={`sd-sheet${selectedCm === s.cm ? " is-selected" : ""}`}>
            <rect x={x0} y={base - s.cm} width={s.cm} height={s.cm} />
            {(labelled.has(s.cm) || selectedCm === s.cm) && (
              <text x={x0 + s.cm - 1.2} y={base - s.cm + 4.2} textAnchor="end">
                {s.label}
              </text>
            )}
            {/* crease along the diagonal of each sheet */}
            <line x1={x0} y1={base} x2={x0 + s.cm} y2={base - s.cm} className="sd-diag" />
          </g>
        ))}
      {showA4 && (
        <g className="sd-a4">
          <rect x={x0 + MAX + 8} y={base - A4.h} width={A4.w} height={A4.h} />
          <text x={x0 + MAX + 8 + A4.w / 2} y={base - A4.h - 2.5} textAnchor="middle">
            A4
          </text>
        </g>
      )}
      {/* scale bar */}
      <g className="sd-scale">
        <line x1={x0} y1={base + 8} x2={x0 + MAX} y2={base + 8} />
        {[0, 50, 100, 150].map((v) => (
          <g key={v}>
            <line x1={x0 + v} y1={base + 5.5} x2={x0 + v} y2={base + 10.5} />
            <text x={x0 + v} y={base + 17} textAnchor={v === 0 ? "start" : v === 150 ? "end" : "middle"}>
              {v} cm
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}
