// Pure helpers for the history screens (no React).
import { addDays, nutrientsForGrams, sumNutrients, weekRange } from "../../domain";
import type { DiaryEntry, LocalDate, Nutrients, WeightLog } from "../../types";

export type DayStatus = "empty" | "complete" | "incomplete";

export type DaySummary = {
  date: LocalDate;
  entryCount: number;
  /** "empty": no entries; "incomplete": some total is null; otherwise "complete". */
  status: DayStatus;
  /** Totals; null when unknown (never 0 for missing data). Empty days have all-null totals. */
  totals: Nutrients;
};

export type WeekSummary = {
  days: DaySummary[];
  loggedDays: number;
  /** Mean kcal over logged days whose kcal total is known; null if there is none. */
  averageKcal: number | null;
};

const NO_TOTALS: Nutrients = { kcal: null, protein: null, carbs: null, fat: null };

export function summarizeDay(date: LocalDate, entries: readonly DiaryEntry[]): DaySummary {
  const mine = entries.filter((e) => e.date === date);
  if (mine.length === 0) return { date, entryCount: 0, status: "empty", totals: NO_TOTALS };
  const totals = sumNutrients(mine.map((e) => nutrientsForGrams(e.per100g, e.grams)));
  const incomplete = Object.values(totals).some((v) => v === null);
  return { date, entryCount: mine.length, status: incomplete ? "incomplete" : "complete", totals };
}

export function summarizeWeek(endDate: LocalDate, entries: readonly DiaryEntry[]): WeekSummary {
  const days = weekRange(endDate).map((d) => summarizeDay(d, entries));
  const logged = days.filter((d) => d.status !== "empty");
  const known = logged.filter((d) => d.totals.kcal !== null);
  const averageKcal =
    known.length === 0 ? null : known.reduce((s, d) => s + (d.totals.kcal as number), 0) / known.length;
  return { days, loggedDays: logged.length, averageKcal };
}

/** End date of the window `offset` weeks before today (0 = ending today). Offsets never go below 0. */
export function weekEnd(today: LocalDate, offset: number): LocalDate {
  return addDays(today, -7 * Math.max(0, offset));
}

/** Fraction of target for the bar, clamped to 0..1; 0 without a usable target. */
export function barFraction(kcal: number | null, target: number | null): number {
  if (kcal === null || target === null || !(target > 0)) return 0;
  return Math.max(0, Math.min(1, kcal / target));
}

export type WeightChart = {
  points: { id: string; date: LocalDate; kg: number; fraction: number }[];
  min: number;
  max: number;
  first: number;
  last: number;
};

/** Last `limit` entries (input is oldest first); fraction 0..1 within min..max. Null when empty. */
export function buildWeightChart(weights: readonly WeightLog[], limit = 30): WeightChart | null {
  const recent = weights.slice(-limit);
  if (recent.length === 0) return null;
  const kgs = recent.map((w) => w.kg);
  const min = Math.min(...kgs);
  const max = Math.max(...kgs);
  const span = max - min;
  return {
    points: recent.map((w) => ({
      id: w.id,
      date: w.date,
      kg: w.kg,
      fraction: span === 0 ? 0.5 : (w.kg - min) / span,
    })),
    min,
    max,
    first: recent[0].kg,
    last: recent[recent.length - 1].kg,
  };
}
