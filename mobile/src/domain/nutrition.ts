import type { Nutrients, Targets } from "../types";

const FIELDS = ["kcal", "protein", "carbs", "fat"] as const;

/** Values for an amount in grams from per-100 g values; null stays null. */
export function nutrientsForGrams(per100g: Nutrients, grams: number): Nutrients {
  const scale = (v: number | null): number | null => (v === null ? null : (v * grams) / 100);
  return {
    kcal: scale(per100g.kcal),
    protein: scale(per100g.protein),
    carbs: scale(per100g.carbs),
    fat: scale(per100g.fat),
  };
}

/** Per-field sum; one null makes that field null. Empty list gives zeros. */
export function sumNutrients(list: readonly Nutrients[]): Nutrients {
  const total: Nutrients = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  for (const field of FIELDS) {
    let sum: number | null = 0;
    for (const item of list) {
      const v = item[field];
      if (v === null) {
        sum = null;
        break;
      }
      sum += v;
    }
    total[field] = sum;
  }
  return total;
}

/** Grams for `quantity` portions, rounded to 2 decimals (half away from zero). */
export function gramsForPortion(gramsPerUnit: number, quantity: number): number {
  const raw = gramsPerUnit * quantity;
  const sign = raw < 0 ? -1 : 1;
  // toPrecision absorbs binary noise such as 1.005 * 100 = 100.49999999999999.
  const scaled = Number((Math.abs(raw) * 100).toPrecision(12));
  const result = (sign * Math.round(scaled)) / 100;
  return result === 0 ? 0 : result;
}

/**
 * Targets minus consumed. A null consumed field counts as 0 (nothing known to
 * subtract). Negative values mean the target was exceeded.
 */
export function remaining(targets: Targets, consumed: Nutrients): Targets {
  return {
    kcal: targets.kcal - (consumed.kcal ?? 0),
    protein: targets.protein - (consumed.protein ?? 0),
    carbs: targets.carbs - (consumed.carbs ?? 0),
    fat: targets.fat - (consumed.fat ?? 0),
  };
}
