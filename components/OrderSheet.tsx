"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface SheetItem {
  sku: string;
  colourId: string;
  units: number;
}
interface SheetState {
  items: SheetItem[];
  /** One idempotency key per order sheet; a new one is issued after a successful submission. */
  key: string;
}
interface Ctx extends SheetState {
  ready: boolean;
  count: number;
  add(item: SheetItem): void;
  setUnits(index: number, units: number): void;
  remove(index: number): void;
  clear(): void;
}

const STORAGE = "nara-order-sheet-v1";
const OrderSheetContext = createContext<Ctx | null>(null);
const newKey = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : "00000000-0000-4000-8000-000000000000");

function load(): SheetState {
  try {
    const raw = window.localStorage.getItem(STORAGE);
    if (raw) {
      const s = JSON.parse(raw) as SheetState;
      if (Array.isArray(s.items) && typeof s.key === "string") return s;
    }
  } catch {
    /* storage blocked: work in memory */
  }
  return { items: [], key: newKey() };
}

export function OrderSheetProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SheetState>({ items: [], key: "" });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Hydrate from storage after mount (server render has no storage).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(load());
    setReady(true);
    const onStorage = (e: StorageEvent) => e.key === STORAGE && setState(load());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const commit = useCallback((next: SheetState) => {
    setState(next);
    try {
      window.localStorage.setItem(STORAGE, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      ready,
      count: state.items.length,
      add(item) {
        const items = [...state.items];
        const i = items.findIndex((x) => x.sku === item.sku && x.colourId === item.colourId);
        if (i >= 0) items[i] = { ...items[i], units: items[i].units + item.units };
        else items.push(item);
        commit({ ...state, items });
      },
      setUnits(index, units) {
        commit({ ...state, items: state.items.map((x, i) => (i === index ? { ...x, units } : x)) });
      },
      remove(index) {
        commit({ ...state, items: state.items.filter((_, i) => i !== index) });
      },
      clear() {
        commit({ items: [], key: newKey() });
      },
    }),
    [state, ready, commit],
  );

  return <OrderSheetContext.Provider value={value}>{children}</OrderSheetContext.Provider>;
}

export function useOrderSheet() {
  const ctx = useContext(OrderSheetContext);
  if (!ctx) throw new Error("useOrderSheet outside provider");
  return ctx;
}
