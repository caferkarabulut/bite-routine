import { barFraction, buildWeightChart, summarizeDay, summarizeWeek, weekEnd } from "../src/features/history/aggregate";
import type { DiaryEntry, Nutrients, WeightLog } from "../src/types";

function entry(date: string, per100g: Nutrients, grams = 100): DiaryEntry {
  return {
    id: `${date}-${grams}-${per100g.kcal}`,
    date,
    mealSlot: "lunch",
    food: { kind: "food", id: "f" },
    foodName: "x",
    grams,
    portion: null,
    per100g,
    createdAt: "",
    updatedAt: "",
  };
}
const full = (kcal: number): Nutrients => ({ kcal, protein: 10, carbs: 20, fat: 5 });
const noKcal: Nutrients = { kcal: null, protein: 10, carbs: 20, fat: 5 };

describe("summarizeDay", () => {
  it("scales per-100g values by grams and sums", () => {
    const d = summarizeDay("2026-11-13", [entry("2026-11-13", full(200), 150), entry("2026-11-13", full(100), 50)]);
    expect(d.status).toBe("complete");
    expect(d.entryCount).toBe(2);
    expect(d.totals).toEqual({ kcal: 350, protein: 20, carbs: 40, fat: 10 });
  });

  it("marks days without entries as empty with null totals", () => {
    const d = summarizeDay("2026-11-12", [entry("2026-11-13", full(100))]);
    expect(d.status).toBe("empty");
    expect(d.totals.kcal).toBeNull();
  });

  it("propagates null: one unknown kcal makes the day total null, not zero", () => {
    const d = summarizeDay("2026-11-13", [entry("2026-11-13", full(100)), entry("2026-11-13", noKcal)]);
    expect(d.status).toBe("incomplete");
    expect(d.totals.kcal).toBeNull();
    expect(d.totals.protein).toBe(20);
  });
});

describe("summarizeWeek", () => {
  it("covers 7 ascending days and averages over logged days only", () => {
    const week = summarizeWeek("2026-11-13", [
      entry("2026-11-13", full(100), 100),
      entry("2026-11-11", full(300), 100),
    ]);
    expect(week.days.map((d) => d.date)[0]).toBe("2026-11-07");
    expect(week.days).toHaveLength(7);
    expect(week.days[6].date).toBe("2026-11-13");
    expect(week.loggedDays).toBe(2);
    expect(week.averageKcal).toBe(200);
  });

  it("excludes incomplete days from the average but counts them as logged", () => {
    const week = summarizeWeek("2026-11-13", [entry("2026-11-13", full(100)), entry("2026-11-12", noKcal)]);
    expect(week.loggedDays).toBe(2);
    expect(week.averageKcal).toBe(100);
  });

  it("has a null average when nothing is logged or all days are incomplete", () => {
    expect(summarizeWeek("2026-11-13", []).averageKcal).toBeNull();
    expect(summarizeWeek("2026-11-13", []).loggedDays).toBe(0);
    expect(summarizeWeek("2026-11-13", [entry("2026-11-13", noKcal)]).averageKcal).toBeNull();
  });
});

describe("weekEnd and barFraction", () => {
  it("steps back in whole weeks and never goes into the future", () => {
    expect(weekEnd("2026-11-13", 0)).toBe("2026-11-13");
    expect(weekEnd("2026-11-13", 1)).toBe("2026-11-06");
    expect(weekEnd("2026-11-13", -3)).toBe("2026-11-13");
  });

  it("clamps the bar and handles missing target or kcal", () => {
    expect(barFraction(1000, 2000)).toBe(0.5);
    expect(barFraction(3000, 2000)).toBe(1);
    expect(barFraction(null, 2000)).toBe(0);
    expect(barFraction(500, null)).toBe(0);
    expect(barFraction(500, 0)).toBe(0);
  });
});

describe("buildWeightChart", () => {
  const log = (i: number, kg: number): WeightLog => ({ id: `w${i}`, date: `2026-10-${String(i).padStart(2, "0")}`, kg, createdAt: "" });

  it("returns null without data", () => {
    expect(buildWeightChart([])).toBeNull();
  });

  it("keeps the last 30 and scales within min..max", () => {
    const logs = Array.from({ length: 31 }, (_, i) => log(i + 1, 80 - i * 0.1));
    const chart = buildWeightChart(logs, 30)!;
    expect(chart.points).toHaveLength(30);
    expect(chart.points[0].id).toBe("w2");
    expect(chart.max).toBeCloseTo(79.9);
    expect(chart.points[0].fraction).toBe(1);
    expect(chart.points[29].fraction).toBe(0);
    expect(chart.first).toBeCloseTo(79.9);
    expect(chart.last).toBeCloseTo(77);
  });

  it("centres a flat series", () => {
    expect(buildWeightChart([log(1, 70), log(2, 70)])!.points.map((p) => p.fraction)).toEqual([0.5, 0.5]);
  });
});
