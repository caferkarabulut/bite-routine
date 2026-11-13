import type {
  ActivityLevel,
  CatalogItemKind,
  FoodRef,
  Goal,
  Language,
  MealSlot,
  Nutrients,
  Portion,
  Sex,
} from "../types";
import { MEAL_SLOTS } from "../types";
import { DbValidationError } from "./types";
import type { DbValidationCode } from "./types";

export const MAX_GRAMS = 10000;
export const MIN_KG = 20;
export const MAX_KG = 400;
export const MAX_ML = 20000;

export const SEXES: readonly Sex[] = ["female", "male"];
export const ACTIVITIES: readonly ActivityLevel[] = [
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active",
];
export const GOALS: readonly Goal[] = ["lose", "maintain", "gain"];
export const LANGUAGES: readonly Language[] = ["tr", "en"];
export const FOOD_KINDS: readonly FoodRef["kind"][] = ["dish", "food", "packaged", "custom"];
export const CATALOG_KINDS: readonly CatalogItemKind[] = ["dish", "food", "packaged"];

export function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

export function isBoolean(v: unknown): v is boolean {
  return typeof v === "boolean";
}

export function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export function isLocalDate(v: unknown): v is string {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y, m, d] = v.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export function isTimestamp(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v) && !Number.isNaN(Date.parse(v));
}

export function isGrams(v: unknown): v is number {
  return isFiniteNumber(v) && v > 0 && v <= MAX_GRAMS;
}

export function isKg(v: unknown): v is number {
  return isFiniteNumber(v) && v >= MIN_KG && v <= MAX_KG;
}

export function isMl(v: unknown): v is number {
  return isFiniteNumber(v) && v >= 0 && v <= MAX_ML;
}

export function isMealSlot(v: unknown): v is MealSlot {
  return typeof v === "string" && (MEAL_SLOTS as readonly string[]).includes(v);
}

export function isOneOf<T extends string>(list: readonly T[], v: unknown): v is T {
  return typeof v === "string" && (list as readonly string[]).includes(v);
}

function nutrientValueOk(v: unknown): boolean {
  return v === null || (isFiniteNumber(v) && v >= 0);
}

export function isNutrients(v: unknown): v is Nutrients {
  return (
    isObject(v) &&
    nutrientValueOk(v.kcal) &&
    nutrientValueOk(v.protein) &&
    nutrientValueOk(v.carbs) &&
    nutrientValueOk(v.fat)
  );
}

export function isPortion(v: unknown): v is Portion {
  return (
    isObject(v) &&
    isNonEmptyString(v.id) &&
    typeof v.nameTr === "string" &&
    (v.nameEn === null || typeof v.nameEn === "string") &&
    isGrams(v.grams)
  );
}

export function isFoodRef(v: unknown): v is FoodRef {
  return isObject(v) && isOneOf(FOOD_KINDS, v.kind) && isNonEmptyString(v.id);
}

export function isPortionSnapshot(v: unknown): boolean {
  return (
    isObject(v) &&
    isNonEmptyString(v.id) &&
    typeof v.name === "string" &&
    isGrams(v.gramsPerUnit) &&
    isFiniteNumber(v.quantity) &&
    v.quantity > 0 &&
    v.quantity <= MAX_GRAMS
  );
}

export function fail(code: DbValidationCode, message: string): never {
  throw new DbValidationError(code, message);
}

export function assertDate(v: unknown, label = "date"): asserts v is string {
  if (!isLocalDate(v)) fail("invalid_date", `${label} must be a valid YYYY-MM-DD date`);
}

export function assertGrams(v: unknown): asserts v is number {
  if (!isGrams(v)) fail("invalid_grams", `grams must be > 0 and <= ${MAX_GRAMS}`);
}

export function assertKg(v: unknown): asserts v is number {
  if (!isKg(v)) fail("invalid_kg", `kg must be between ${MIN_KG} and ${MAX_KG}`);
}

export function assertMl(v: unknown, label = "ml"): asserts v is number {
  if (!isMl(v)) fail("invalid_ml", `${label} must be between 0 and ${MAX_ML}`);
}

export function assertMealSlot(v: unknown): asserts v is MealSlot {
  if (!isMealSlot(v)) fail("invalid_meal_slot", `mealSlot must be one of ${MEAL_SLOTS.join(", ")}`);
}

export function assertValue(ok: boolean, message: string): asserts ok {
  if (!ok) fail("invalid_value", message);
}

let counter = 0;
/** Unique-enough id without expo-crypto: time + counter + random. */
export function newId(prefix: string): string {
  counter = (counter + 1) % 1679616;
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}${counter.toString(36)}${rand}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
