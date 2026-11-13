import type { CatalogItem } from "../src/types";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  CatalogIndex,
  foldTr,
  getCatalog,
  getCatalogItem,
  normalizeTr,
  searchCatalog,
} from "../src/catalog";

const nutrients = { kcal: 100, protein: 1, carbs: 1, fat: 1 };

function item(over: Partial<CatalogItem> & { id: string; nameTr: string }): CatalogItem {
  return {
    kind: "dish",
    category: "corba",
    nameEn: null,
    aliases: [],
    per100g: nutrients,
    portions: [],
    source: {},
    ...over,
  };
}

describe("normalization", () => {
  it.each([
    ["İstanbul", "istanbul"],
    ["ISPANAK", "ıspanak"],
    ["Iğdır", "ığdır"],
    ["KISIR", "kısır"],
    ["ÇAY ŞEKERLİ", "çay şekerli"],
    ["Mercimek   çorbası ", "mercimek çorbası"],
    ["Çay (şekerli)", "çay şekerli"],
    ["Ali's  köfte", "alis köfte"],
  ])("normalizeTr(%j) = %j", (input, expected) => {
    expect(normalizeTr(input)).toBe(expected);
  });

  it.each([
    ["ç", "c"],
    ["ğ", "g"],
    ["ı", "i"],
    ["ö", "o"],
    ["ş", "s"],
    ["ü", "u"],
    ["â", "a"],
    ["î", "i"],
    ["û", "u"],
    ["Ç", "c"],
    ["Ğ", "g"],
    ["İ", "i"],
    ["I", "i"],
    ["Ö", "o"],
    ["Ş", "s"],
    ["Ü", "u"],
  ])("foldTr(%j) = %j", (input, expected) => {
    expect(foldTr(input)).toBe(expected);
  });

  it("folds whole words", () => {
    expect(foldTr("Kısır")).toBe("kisir");
    expect(foldTr("KISIR")).toBe("kisir");
    expect(foldTr("çay şekerli")).toBe("cay sekerli");
    expect(foldTr("ŞEKER")).toBe("seker");
  });
});

describe("search ranking (fixture)", () => {
  const items = [
    item({ id: "a", nameTr: "Domates çorbası" }),
    item({ id: "b", nameTr: "Çorba" }),
    item({ id: "c", nameTr: "Çorbalık tavuk", kind: "food", category: "temel-gida" }),
    item({ id: "d", nameTr: "Yayla", aliases: ["çorba"] }),
    item({ id: "e", nameTr: "Ezogelin çorba" }),
    item({ id: "f", nameTr: "Bulgur", kind: "packaged", category: "paketli", brand: "Ülker" }),
    item({ id: "g", nameTr: "Sütlüçorba" }),
    item({ id: "h", nameTr: "Çorba paketi", kind: "packaged", category: "paketli" }),
    item({ id: "i", nameTr: "Arpa şehriye çorbası" }),
  ];
  const index = new CatalogIndex(items);
  const ids = (q: string, o?: Parameters<CatalogIndex["search"]>[1]) => index.search(q, o).map((x) => x.id);

  it("orders exact > prefix > word prefix > alias > substring", () => {
    // exact: b; prefix: c (len 14) and h (packaged, after); word-prefix: a, e, i; alias: d; substring: g
    expect(ids("corba")).toEqual(["b", "c", "h", "e", "a", "i", "d", "g"]);
  });

  it("breaks ties: dish/food before packaged, shorter first, then Turkish alphabetical", () => {
    const idx = new CatalogIndex([
      item({ id: "p", nameTr: "Süt A", kind: "packaged", category: "paketli" }),
      item({ id: "z", nameTr: "Süt Z" }),
      item({ id: "ç", nameTr: "Süt Ç" }),
      item({ id: "l", nameTr: "Süt Lü" }),
    ]);
    expect(idx.search("süt").map((x) => x.id)).toEqual(["ç", "z", "l", "p"]);
  });

  it("matches brand for packaged items", () => {
    expect(ids("ulker")).toEqual(["f"]);
  });

  it("matches all tokens in any order", () => {
    expect(ids("tavuk corbalik")).toEqual(["c"]);
  });

  it("filters by kinds and category", () => {
    expect(ids("corba", { kinds: ["packaged"] })).toEqual(["h"]);
    expect(ids("corba", { category: "temel-gida" })).toEqual(["c"]);
  });

  it("respects limit", () => {
    expect(ids("corba", { limit: 2 })).toEqual(["b", "c"]);
    expect(ids("corba", { limit: 0 })).toEqual([]);
  });

  it("empty query: category listing alphabetical, otherwise nothing", () => {
    expect(ids("")).toEqual([]);
    expect(ids("   ")).toEqual([]);
    expect(ids("", { category: "corba" })).toEqual(["i", "b", "a", "e", "g", "d"]);
  });

  it("returns nothing for no match", () => {
    expect(ids("zzzz")).toEqual([]);
  });
});

describe("real catalog", () => {
  const names = (q: string, o?: Parameters<typeof searchCatalog>[1]) => searchCatalog(q, o).map((x) => x.nameTr);

  it("loads and indexes by id", () => {
    const all = getCatalog();
    expect(all.length).toBeGreaterThanOrEqual(180);
    expect(getCatalogItem("mercimek-corbasi")?.nameTr).toBe("Mercimek çorbası");
    expect(getCatalogItem("yok-boyle-bir-id")).toBeUndefined();
  });

  it("every category used has a label", () => {
    for (const c of new Set(getCatalog().map((i) => i.category))) {
      expect(CATEGORY_LABELS[c]).toBeDefined();
      expect(CATEGORY_ORDER).toContain(c);
    }
    expect(CATEGORY_ORDER.length).toBe(Object.keys(CATEGORY_LABELS).length);
  });

  it("mercimek finds Mercimek çorbası first", () => {
    expect(names("mercimek")[0]).toBe("Mercimek çorbası");
  });

  it.each(["kisir", "KISIR", "kısır", "Kısır", "KISIR "])("finds Kısır for %j", (q) => {
    expect(names(q)).toContain("Kısır");
    expect(names(q)[0]).toBe("Kısır");
  });

  it("cay finds both çay entries", () => {
    const r = names("cay");
    expect(r).toContain("Çay (şekerli)");
    expect(r).toContain("Çay (şekersiz)");
    expect(r.slice(0, 2).sort()).toEqual(["Çay (şekerli)", "Çay (şekersiz)"]);
  });

  it("çay şekerli and seker find the sugary tea", () => {
    expect(names("çay şekerli")[0]).toBe("Çay (şekerli)");
    expect(names("seker")).toContain("Çay (şekerli)");
  });

  it("adana finds Adana kebap", () => {
    expect(names("adana").some((n) => n.startsWith("Adana"))).toBe(true);
  });

  it("lists a category alphabetically", () => {
    const r = searchCatalog("", { category: "corba" });
    expect(r.length).toBe(10);
    expect(r.every((i) => i.category === "corba")).toBe(true);
    const sorted = [...r].sort((a, b) => a.nameTr.localeCompare(b.nameTr, "tr"));
    expect(r.map((i) => i.id)).toEqual(sorted.map((i) => i.id));
  });

  it("empty query without category is empty; kinds filter works", () => {
    expect(searchCatalog("")).toEqual([]);
    expect(searchCatalog("a", { kinds: ["food"], limit: 500 }).every((i) => i.kind === "food")).toBe(true);
  });
});

describe("performance", () => {
  it("searches 10k synthetic items quickly", () => {
    const syll = ["ka", "ra", "me", "şi", "çö", "ğu", "la", "pı", "tü", "so", "ba", "ne"];
    let seed = 7;
    const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
    const word = () => Array.from({ length: 2 + Math.floor(rnd() * 3) }, () => syll[Math.floor(rnd() * syll.length)]).join("");
    const items = Array.from({ length: 10000 }, (_, i) =>
      item({
        id: `s${i}`,
        nameTr: `${word()} ${word()} ${word()}`,
        aliases: [word(), word()],
        kind: i % 3 === 0 ? "packaged" : "dish",
        brand: i % 3 === 0 ? word() : null,
      }),
    );
    const index = new CatalogIndex(items);
    const queries = ["ka", "kara", "şi", "çöğu", "mela pı", "x", "tüso", "ba ne"];
    index.search("warm"); // JIT warm-up
    const runs = 50;
    const start = performance.now();
    for (let r = 0; r < runs; r++) for (const q of queries) index.search(q);
    const perQuery = (performance.now() - start) / (runs * queries.length);
    console.log(`search over 10k items: ${perQuery.toFixed(2)} ms/query`);
    expect(perQuery).toBeLessThan(20);
  });
});
