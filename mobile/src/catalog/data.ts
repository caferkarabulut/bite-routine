import type { CatalogItem } from "../types";
import catalogJson from "../../assets/catalog.json";

const KINDS = ["dish", "food", "packaged"];
const NUTRIENT_KEYS = ["kcal", "protein", "carbs", "fat"];

/** Throws a descriptive error when the bundled catalog has an unexpected shape. */
export function validateCatalog(data: unknown): asserts data is { version: number; items: CatalogItem[] } {
  const root = data as { version?: unknown; items?: unknown } | null;
  if (!root || typeof root.version !== "number" || !Array.isArray(root.items)) {
    throw new Error("catalog.json: expected { version, items[] }");
  }
  const seen = new Set<string>();
  root.items.forEach((raw, i) => {
    const it = raw as Partial<CatalogItem> | null;
    const where = `catalog.json items[${i}]`;
    if (!it || typeof it.id !== "string" || !it.id) throw new Error(`${where}: missing id`);
    if (seen.has(it.id)) throw new Error(`${where}: duplicate id ${it.id}`);
    seen.add(it.id);
    if (!KINDS.includes(it.kind as string)) throw new Error(`${where} (${it.id}): bad kind`);
    if (typeof it.category !== "string") throw new Error(`${where} (${it.id}): bad category`);
    if (typeof it.nameTr !== "string" || !it.nameTr) throw new Error(`${where} (${it.id}): bad nameTr`);
    if (!Array.isArray(it.aliases)) throw new Error(`${where} (${it.id}): bad aliases`);
    if (!Array.isArray(it.portions)) throw new Error(`${where} (${it.id}): bad portions`);
    const n = it.per100g as Record<string, unknown> | undefined;
    if (!n || NUTRIENT_KEYS.some((k) => n[k] !== null && typeof n[k] !== "number")) {
      throw new Error(`${where} (${it.id}): bad per100g`);
    }
  });
}

let items: CatalogItem[] | null = null;
let byId: Map<string, CatalogItem> | null = null;

/** All bundled catalog items (validated once; validation is skipped in production builds). */
export function getCatalog(): CatalogItem[] {
  if (!items) {
    const dev = typeof __DEV__ !== "undefined" ? __DEV__ : process.env.NODE_ENV !== "production";
    if (dev) validateCatalog(catalogJson);
    items = (catalogJson as unknown as { items: CatalogItem[] }).items;
  }
  return items;
}

export function getCatalogItem(id: string): CatalogItem | undefined {
  if (!byId) byId = new Map(getCatalog().map((item) => [item.id, item]));
  return byId.get(id);
}
