"use client";

import { useId, useState } from "react";

const SIZES = [15, 25, 37.5, 50, 70, 100, 150, 200, 300];

/** Cell size = sheet ÷ grid. Ported from the studio's earlier custom-grid calculator. */
export function GridCalculator() {
  const id = useId();
  const [sheet, setSheet] = useState(150);
  const [grid, setGrid] = useState(64);
  const cell = sheet / grid;
  const halvings = Math.log2(grid);
  const pureHalving = Number.isInteger(halvings);
  return (
    <form className="calc" onSubmit={(e) => e.preventDefault()} aria-labelledby={`${id}-t`}>
      <p id={`${id}-t`} className="eyebrow">Grid calculator</p>
      <div className="calc-row">
        <div className="field">
          <label htmlFor={`${id}-s`}>Sheet edge</label>
          <select id={`${id}-s`} className="select" value={sheet} onChange={(e) => setSheet(Number(e.target.value))}>
            {SIZES.map((s) => <option key={s} value={s}>{s} cm</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${id}-g`}>Grid divisions</label>
          <input id={`${id}-g`} className="input" type="number" inputMode="numeric" min={2} max={256} value={grid} onChange={(e) => setGrid(Math.min(256, Math.max(2, Number(e.target.value) || 2)))} />
        </div>
      </div>
      <output htmlFor={`${id}-s ${id}-g`} className="calc-out" aria-live="polite">
        <span className="calc-big">{cell.toFixed(2)} cm</span>
        <span className="mono">
          per cell ({(cell * 10).toFixed(1)} mm) · {sheet} ÷ {grid}
        </span>
        <span className="mono">{pureHalving ? `Reachable by halving alone (2^${halvings}).` : "Needs an odd division before halving."}</span>
      </output>
    </form>
  );
}
