import "server-only";
import path from "node:path";
import { FileStore } from "./file";
import { SupabaseStore } from "./supabase";
import type { Store } from "./types";
import { mergeCatalogue } from "./catalogue-merge";

let cached: Store | null | undefined;

/**
 * Picks the storage backend:
 *  - Supabase when SUPABASE_URL + SUPABASE_SECRET_KEY are set (production).
 *  - A local JSON file in development / tests (never in production).
 *  - Otherwise null: the site still renders, and ordering shows an honest "email us" fallback.
 */
export function getStore(): Store | null {
  if (cached !== undefined) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) cached = new SupabaseStore(url, key);
  else if (process.env.NODE_ENV !== "production" || process.env.NARA_FILE_STORE === "1")
    cached = new FileStore(path.join(process.env.NARA_DATA_DIR ?? path.join(process.cwd(), ".data"), "store.json"));
  else cached = null;
  return cached;
}

/** Catalogue for public pages. Falls back to content defaults if the database is unreachable. */
export async function getCatalogueSafe() {
  const store = getStore();
  if (!store) return mergeCatalogue({}, {});
  try {
    return await store.getCatalogue();
  } catch (e) {
    console.error("[catalogue] falling back to content defaults:", (e as Error).message);
    return mergeCatalogue({}, {});
  }
}
