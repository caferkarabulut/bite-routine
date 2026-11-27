// Shared view model for catalog items and custom foods.
import type { CatalogItem, CustomFood, FoodRef, LocalDate, MealSlot, Nutrients, Portion } from "../../types";
import { MEAL_SLOTS } from "../../types";
import { isValidLocalDate, nutrientsForGrams } from "../../domain";
import { formatGrams } from "../../i18n";

export type FoodView = {
  ref: FoodRef;
  /** Name for the given language (English only when the catalog has it). */
  name: string;
  nameTr: string;
  per100g: Nutrients;
  portions: Portion[];
  brand: string | null;
  /** Catalog category key; null for custom foods. */
  category: string | null;
  isCustom: boolean;
  isDrink?: boolean;
};

export function viewOfCatalogItem(item: CatalogItem, lang: "tr" | "en"): FoodView {
  return {
    ref: { kind: item.kind, id: item.id },
    name: lang === "en" && item.nameEn ? item.nameEn : item.nameTr,
    nameTr: item.nameTr,
    per100g: item.per100g,
    portions: item.portions,
    brand: item.brand ?? null,
    category: item.category,
    isCustom: false,
  };
}

export function viewOfCustomFood(food: CustomFood): FoodView {
  return {
    ref: { kind: "custom", id: food.id },
    name: food.nameTr,
    nameTr: food.nameTr,
    per100g: food.per100g,
    portions: food.portions,
    brand: food.brand ?? null,
    category: null,
    isCustom: true,
    isDrink: food.kind === "drink",
  };
}

export function asLocalDate(value: unknown): LocalDate | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return isValidLocalDate(v) ? v : undefined;
}

export function asMealSlot(value: unknown): MealSlot | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return typeof v === "string" && (MEAL_SLOTS as readonly string[]).includes(v) ? (v as MealSlot) : undefined;
}

export function asString(value: unknown): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return typeof v === "string" && v ? v : undefined;
}

/**
 * What a list row shows: the amount the detail screen opens with (first portion x 1, or 100 g when the food has
 * no portion) and its kcal. Same rule as `defaultAmount`; kcal stays null when the data is missing.
 */
export function defaultServing(food: FoodView, lang: "tr" | "en"): { label: string; kcal: number | null } {
  const portion = food.portions[0];
  const grams = portion ? portion.grams : 100;
  const label = food.isCustom ? formatFoodAmount(food, grams, lang) : portion ? (lang === "en" && portion.nameEn ? portion.nameEn : portion.nameTr) : formatFoodAmount(food, 100, lang);
  return { label, kcal: nutrientsForGrams(food.per100g, grams).kcal };
}

/** Only the food amount changes unit; nutrient macros always remain in grams. */
export function formatFoodAmount(food: FoodView, grams: number, lang: "tr" | "en"): string {
  const text = formatGrams(grams, lang);
  return food.isDrink ? text.replace(/ g$/, " ml") : text;
}

/** Resolve before limiting so missing foods do not hide older valid recent choices. */
export function recentFoodViews(refs: FoodRef[], customFoods: CustomFood[], lang: "tr" | "en", lookup: (id: string) => CatalogItem | undefined): FoodView[] {
  const foods: FoodView[] = [];
  for (const ref of refs) {
    if (ref.kind === "custom") {
      const food = customFoods.find((f) => f.id === ref.id);
      if (food) foods.push(viewOfCustomFood(food));
    } else {
      const item = lookup(ref.id);
      if (item && item.kind === ref.kind) foods.push(viewOfCatalogItem(item, lang));
    }
    if (foods.length === 8) break;
  }
  return foods;
}
