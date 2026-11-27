import type { MealSlot } from "../types";

/** Suggested meal for an hour of the local day (0–23). */
export function defaultMealForTime(hour: number): MealSlot {
  if (hour >= 5 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 16) return "lunch";
  if (hour >= 16 && hour < 22) return "dinner";
  return "snack";
}
