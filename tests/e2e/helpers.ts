import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";

export const DATA = path.join(__dirname, "..", "..", "test-results", "e2e-data");
export const readStore = () => (existsSync(path.join(DATA, "store.json")) ? JSON.parse(readFileSync(path.join(DATA, "store.json"), "utf8")) : { orders: [], notifications: [], enquiries: [] });
export const mailFiles = () => (existsSync(path.join(DATA, "mail")) ? readdirSync(path.join(DATA, "mail")).filter((f) => f.endsWith(".txt")).map((f) => readFileSync(path.join(DATA, "mail", f), "utf8")) : []);
export const PUBLIC_PAGES = ["/", "/artworks", "/artworks?view=index", "/artworks/sun-wukong-the-monkey-king", "/artworks/agniv-the-monk-of-fire", "/projects", "/projects/vajrabhairava", "/shop", "/shop/double-tissue-100cm", "/learn", "/learn/grids-and-sheet-size", "/learn/from-grid-to-finished-fold", "/journal", "/journal/shivaji-maharaj-horse-collapsed", "/about", "/commissions", "/press", "/contact", "/shipping", "/terms", "/privacy", "/accessibility"];
