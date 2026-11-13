// Shared view model for catalog items and custom foods.
import type { CatalogItem, CustomFood, FoodRef, LocalDate, MealSlot, Nutrients, Portion } from "../../types";
import { MEAL_SLOTS } from "../../types";
import { isValidLocalDate } from "../../domain";

export type FoodView = {
  ref: FoodRef;
  /** Name for the given language (English only when the catalog has it). */
  name: string;
  nameTr: string;
  per100g: Nutrients;
  portions: Portion[];
  brand: string | null;
  isCustom: boolean;
};

export function viewOfCatalogItem(item: CatalogItem, lang: "tr" | "en"): FoodView {
  return {
    ref: { kind: item.kind, id: item.id },
    name: lang === "en" && item.nameEn ? item.nameEn : item.nameTr,
    nameTr: item.nameTr,
    per100g: item.per100g,
    portions: item.portions,
    brand: item.brand ?? null,
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
    brand: null,
    isCustom: true,
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
