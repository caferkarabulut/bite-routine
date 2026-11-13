import type { CatalogItem, CatalogItemKind } from "../types";
import { getCatalog } from "./data";
import { foldTr } from "./normalize";

export type SearchOptions = {
  kinds?: readonly CatalogItemKind[];
  category?: string;
  /** Default 50. */
  limit?: number;
};

type Entry = {
  item: CatalogItem;
  name: string; // folded name
  nameWords: string[];
  aliases: string[]; // folded
  brand: string; // folded, "" when none
  kindRank: number;
};

// Lower tier = better match.
const T_EXACT = 0;
const T_PREFIX = 1;
const T_WORD_PREFIX = 2;
const T_ALIAS = 3;
const T_SUBSTRING = 4;
const T_TOKENS = 5;

const collator = (() => {
  try {
    return new Intl.Collator("tr");
  } catch {
    return null;
  }
})();

function compareTr(a: string, b: string): number {
  return collator ? collator.compare(a, b) : a.localeCompare(b, "tr");
}

function buildEntry(item: CatalogItem): Entry {
  const name = foldTr(item.nameTr);
  return {
    item,
    name,
    nameWords: name.split(" "),
    aliases: item.aliases.map(foldTr).filter(Boolean),
    brand: item.brand ? foldTr(item.brand) : "",
    kindRank: item.kind === "packaged" ? 1 : 0,
  };
}

function hasWordPrefix(words: string[], q: string): boolean {
  for (let i = 0; i < words.length; i++) if (words[i].startsWith(q)) return true;
  return false;
}

function prefixOrWordPrefix(text: string, q: string): boolean {
  return text.startsWith(q) || text.includes(` ${q}`);
}

/** Returns the match tier for the folded query, or -1 for no match. */
function tierFor(e: Entry, q: string, tokens: string[]): number {
  if (e.name === q) return T_EXACT;
  if (e.name.startsWith(q)) return T_PREFIX;
  if (hasWordPrefix(e.nameWords, q)) return T_WORD_PREFIX;
  for (let i = 0; i < e.aliases.length; i++) if (prefixOrWordPrefix(e.aliases[i], q)) return T_ALIAS;
  if (e.name.includes(q)) return T_SUBSTRING;
  for (let i = 0; i < e.aliases.length; i++) if (e.aliases[i].includes(q)) return T_SUBSTRING;
  if (e.brand && (e.brand.includes(q) || prefixOrWordPrefix(`${e.brand} ${e.name}`, q))) return T_SUBSTRING;
  if (tokens.length > 1) {
    const hay = `${e.name} ${e.aliases.join(" ")} ${e.brand}`;
    if (tokens.every((t) => hay.includes(t))) return T_TOKENS;
  }
  return -1;
}

export class CatalogIndex {
  private readonly entries: Entry[];

  constructor(items: readonly CatalogItem[]) {
    this.entries = items.map(buildEntry);
  }

  search(query: string, options: SearchOptions = {}): CatalogItem[] {
    const { kinds, category, limit = 50 } = options;
    const q = foldTr(query);
    if (limit <= 0) return [];
    if (!q && !category) return [];

    const kindOk = kinds && kinds.length > 0 ? (k: CatalogItemKind) => kinds.includes(k) : null;
    const tokens = q ? q.split(" ") : [];
    const hits: { e: Entry; tier: number }[] = [];

    for (const e of this.entries) {
      if (category && e.item.category !== category) continue;
      if (kindOk && !kindOk(e.item.kind)) continue;
      if (!q) {
        hits.push({ e, tier: 0 });
        continue;
      }
      const tier = tierFor(e, q, tokens);
      if (tier >= 0) hits.push({ e, tier });
    }

    if (!q) {
      hits.sort((a, b) => compareTr(a.e.item.nameTr, b.e.item.nameTr));
    } else {
      hits.sort(
        (a, b) =>
          a.tier - b.tier ||
          a.e.kindRank - b.e.kindRank ||
          a.e.name.length - b.e.name.length ||
          compareTr(a.e.item.nameTr, b.e.item.nameTr),
      );
    }
    return hits.slice(0, limit).map((h) => h.e.item);
  }
}

let defaultIndex: CatalogIndex | null = null;

/** Searches the bundled catalog (index is built once, lazily). */
export function searchCatalog(query: string, options?: SearchOptions): CatalogItem[] {
  if (!defaultIndex) defaultIndex = new CatalogIndex(getCatalog());
  return defaultIndex.search(query, options);
}
