import { formatWeekday } from "../src/i18n";
import { canGoForward, dayTitleKind } from "../src/features/today/dayTitle";
import { entryAmountText } from "../src/features/today/entryAmount";
import { glassFills, glassSizeMl } from "../src/features/today/water";

const portion = (quantity: number, name: string) => ({ id: "p", name, gramsPerUnit: 150, quantity });

describe("entryAmountText", () => {
  it("reads 'amount · grams' for a portion without doubling the count in the name", () => {
    expect(entryAmountText({ grams: 225, portion: portion(1.5, "1 kepçe") }, "tr")).toBe("1,5 kepçe · 225 g");
    expect(entryAmountText({ grams: 66, portion: portion(1.5, "1 cup") }, "en")).toBe("1.5 cup · 66 g");
  });

  it("keeps the portion name for one unit", () => {
    expect(entryAmountText({ grams: 150, portion: portion(1, "1 kepçe") }, "tr")).toBe("1 kepçe · 150 g");
  });

  it("uses a multiplier for names without a leading 1", () => {
    expect(entryAmountText({ grams: 88, portion: portion(2, "Orta adet") }, "tr")).toBe("2 × Orta adet · 88 g");
    expect(entryAmountText({ grams: 100, portion: portion(2, "10 tane") }, "tr")).toBe("2 × 10 tane · 100 g");
  });

  it("shows only grams for gram entries", () => {
    expect(entryAmountText({ grams: 40, portion: null }, "tr")).toBe("40 g");
    expect(entryAmountText({ grams: 22.5, portion: null }, "tr")).toBe("22,5 g");
    expect(entryAmountText({ grams: 1250, portion: null }, "tr")).toBe("1.250 g");
  });
});

describe("glassFills", () => {
  it("draws one 200 ml glass each", () => {
    expect(glassFills(700, 2000)).toEqual([1, 1, 1, 0.5, 0, 0, 0, 0, 0, 0]);
    expect(glassFills(0, 400)).toEqual([0, 0]);
  });

  it("rounds the glass count up and fills everything above the goal", () => {
    expect(glassFills(2500, 500)).toEqual([1, 1, 1]);
    expect(glassFills(500, 500)).toEqual([1, 1, 0.5]);
  });

  it("uses at most 12 glasses and resizes them above 2.400 ml", () => {
    expect(glassSizeMl(2400)).toBe(200);
    expect(glassFills(0, 2400)).toHaveLength(12);
    expect(glassSizeMl(3000)).toBe(250);
    const fills = glassFills(1000, 3000);
    expect(fills).toHaveLength(12);
    expect(fills.slice(0, 4)).toEqual([1, 1, 1, 1]);
    expect(fills[4]).toBe(0);
  });

  it("never returns an empty row", () => {
    expect(glassFills(100, 0)).toEqual([0.5]);
    expect(glassFills(Number.NaN, Number.NaN)).toEqual([0]);
  });
});

describe("dayTitleKind", () => {
  it("names today, yesterday and other days", () => {
    expect(dayTitleKind("2026-11-27", "2026-11-27")).toBe("today");
    expect(dayTitleKind("2026-11-26", "2026-11-27")).toBe("yesterday");
    expect(dayTitleKind("2026-11-25", "2026-11-27")).toBe("weekday");
    expect(dayTitleKind("2026-11-28", "2026-11-27")).toBe("tomorrow");
    expect(dayTitleKind("2026-11-29", "2026-11-27")).toBe("weekday");
  });

  it("allows forward navigation up to 7 days after today", () => {
    expect(canGoForward("2026-11-27", "2026-11-27")).toBe(true);
    expect(canGoForward("2026-12-03", "2026-11-27")).toBe(true);
    expect(canGoForward("2026-12-04", "2026-11-27")).toBe(false);
    expect(canGoForward("2026-12-05", "2026-11-27")).toBe(false);
  });
});

describe("formatWeekday", () => {
  it("returns the full weekday name", () => {
    expect(formatWeekday("2026-11-27", "tr")).toBe("Cuma");
    expect(formatWeekday("2026-11-27", "en")).toBe("Friday");
  });
});
