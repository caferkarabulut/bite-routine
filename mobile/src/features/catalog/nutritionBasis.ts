import type { Nutrients } from "../../types";

/** Label values for one portion -> per 100 g. Drinks use the same scale: 1 ml = 1 g. */
export function portionToPer100g(values: Nutrients, grams: number): Nutrients {
  if (!Number.isFinite(grams) || grams <= 0 || grams > 10000) {
    throw new RangeError("Portion amount must be above zero and at most 10000");
  }
  const convert = (value: number | null) => {
    if (value === null) return null;
    if (!Number.isFinite(value) || value < 0) throw new RangeError("Invalid nutrient value");
    const converted = value * (100 / grams);
    if (!Number.isFinite(converted)) throw new RangeError("Invalid converted nutrient value");
    return converted;
  };
  return { kcal: convert(values.kcal), protein: convert(values.protein), carbs: convert(values.carbs), fat: convert(values.fat) };
}
