import { createTranslator, en, formatDate, formatGrams, formatKcal, formatNumber, languageFromLocaleCode, tr } from "../src/i18n";

function leafPaths(node: unknown, prefix = ""): string[] {
  if (typeof node === "string") return [prefix];
  if (typeof node !== "object" || node === null) return [`${prefix}!invalid`];
  return Object.entries(node).flatMap(([k, v]) => leafPaths(v, prefix ? `${prefix}.${k}` : k));
}

describe("dictionaries", () => {
  it("tr and en have identical key trees at runtime", () => {
    expect(leafPaths(en).sort()).toEqual(leafPaths(tr).sort());
  });

  it("has no empty strings", () => {
    for (const dict of [tr, en]) {
      for (const path of leafPaths(dict)) {
        const text = path.split(".").reduce<unknown>((n, k) => (n as Record<string, unknown>)[k], dict);
        expect(typeof text === "string" && text.trim().length > 0).toBe(true);
      }
    }
  });

  it("uses the same placeholders in both languages", () => {
    const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
    const get = (dict: unknown, path: string) =>
      path.split(".").reduce<unknown>((n, k) => (n as Record<string, unknown>)[k], dict) as string;
    for (const path of leafPaths(tr)) {
      expect(placeholders(get(en, path))).toEqual(placeholders(get(tr, path)));
    }
  });

  it("contains the required Turkish strings", () => {
    expect([tr.tabs.today, tr.tabs.catalog, tr.tabs.history, tr.tabs.settings]).toEqual(["Bugün", "Katalog", "Geçmiş", "Ayarlar"]);
    expect(tr.disclaimer).toBe("Değerler yaklaşıktır, tıbbi tavsiye değildir.");
    expect(tr.sources.usda).toContain("USDA FoodData Central");
    expect(tr.sources.off).toContain("ODbL");
    expect(en.sources.off).toContain("Open Food Facts");
  });
});

describe("createTranslator", () => {
  it("translates dotted keys", () => {
    expect(createTranslator("tr")("tabs.today")).toBe("Bugün");
    expect(createTranslator("en")("tabs.today")).toBe("Today");
  });

  it("substitutes placeholders, including numbers and repeats", () => {
    const t = createTranslator("tr");
    expect(t("today.remainingKcal", { kcal: "1.250" })).toBe("1.250 kcal kaldı");
    expect(t("today.waterProgress", { ml: 500, goal: 2000 })).toBe("500 / 2000 ml");
    expect(createTranslator("en")("profile.errors.birthYear", { min: 1900, max: 2020 })).toBe(
      "Birth year must be between 1900 and 2020.",
    );
  });

  it("leaves unknown placeholders untouched", () => {
    expect(createTranslator("tr")("today.remainingKcal")).toBe("{kcal} kcal kaldı");
    expect(createTranslator("tr")("today.remainingKcal", { other: 1 })).toBe("{kcal} kcal kaldı");
  });

  it("returns the key for an unknown key", () => {
    // @ts-expect-error not a real key
    expect(createTranslator("tr")("nope.missing")).toBe("nope.missing");
  });
});

describe("languageFromLocaleCode", () => {
  it.each([
    ["en", "en"],
    ["en-US", "en"],
    ["EN", "en"],
    ["tr", "tr"],
    ["tr-TR", "tr"],
    ["de", "tr"],
    ["fil", "tr"],
    [null, "tr"],
    [undefined, "tr"],
  ] as const)("%s -> %s", (code, expected) => {
    expect(languageFromLocaleCode(code)).toBe(expected);
  });
});

describe("format", () => {
  it("formats Turkish numbers with comma decimals and dot thousands", () => {
    expect(formatNumber(1234.5, "tr", 1)).toBe("1.234,5");
    expect(formatNumber(1234567, "tr")).toBe("1.234.567");
    expect(formatNumber(999, "tr")).toBe("999");
    expect(formatNumber(0.5, "tr", 2)).toBe("0,50");
    expect(formatNumber(-1234.56, "tr", 1)).toBe("-1.234,6");
    expect(formatNumber(-0.001, "tr", 1)).toBe("0,0");
  });

  it("formats English numbers", () => {
    expect(formatNumber(1234.5, "en", 1)).toBe("1,234.5");
    expect(formatNumber(1000, "en")).toBe("1,000");
  });

  it("rounds to the requested digits", () => {
    expect(formatNumber(2.675, "en", 0)).toBe("3");
    expect(formatNumber(12.34, "tr", 0)).toBe("12");
  });

  it("formats kcal and grams, with a dash for null", () => {
    expect(formatKcal(1850.4, "tr")).toBe("1.850 kcal");
    expect(formatKcal(null, "tr")).toBe("—");
    expect(formatGrams(12.5, "tr")).toBe("12,5 g");
    expect(formatGrams(150, "tr")).toBe("150 g");
    expect(formatGrams(12.04, "en")).toBe("12 g");
    expect(formatGrams(null, "en")).toBe("—");
  });

  it("formats dates", () => {
    expect(formatDate("2026-11-13", "tr")).toBe("13 Kasım Cuma");
    expect(formatDate("2026-03-01", "tr")).toBe("1 Mart Pazar");
    expect(formatDate("2026-08-31", "tr")).toBe("31 Ağustos Pazartesi");
    expect(formatDate("2026-11-13", "en")).toBe("Friday, November 13");
  });
});
