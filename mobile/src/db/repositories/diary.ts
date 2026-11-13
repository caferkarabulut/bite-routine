import type {
  DiaryEntry,
  DiaryEntryPatch,
  FoodRef,
  MealSlot,
  NewDiaryEntry,
  PortionSnapshot,
} from "../../types";
import { DbValidationError } from "../types";
import type { Db, SqlParams } from "../types";
import {
  assertDate,
  assertGrams,
  assertMealSlot,
  assertValue,
  fail,
  isFoodRef,
  isNonEmptyString,
  isNutrients,
  isPortionSnapshot,
  newId,
  nowIso,
} from "../validation";

type EntryRow = {
  id: string;
  date: string;
  meal_slot: string;
  food_kind: string;
  food_id: string;
  food_name: string;
  grams: number;
  portion_id: string | null;
  portion_name: string | null;
  portion_grams_per_unit: number | null;
  portion_quantity: number | null;
  kcal: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  created_at: string;
  updated_at: string;
};

export function rowToEntry(r: EntryRow): DiaryEntry {
  const portion: PortionSnapshot | null =
    r.portion_id === null
      ? null
      : {
          id: r.portion_id,
          name: r.portion_name ?? "",
          gramsPerUnit: r.portion_grams_per_unit ?? 0,
          quantity: r.portion_quantity ?? 0,
        };
  return {
    id: r.id,
    date: r.date,
    mealSlot: r.meal_slot as MealSlot,
    food: { kind: r.food_kind, id: r.food_id } as FoodRef,
    foodName: r.food_name,
    grams: r.grams,
    portion,
    per100g: { kcal: r.kcal, protein: r.protein, carbs: r.carbs, fat: r.fat },
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function entryParams(e: DiaryEntry): SqlParams {
  return [
    e.id,
    e.date,
    e.mealSlot,
    e.food.kind,
    e.food.id,
    e.foodName,
    e.grams,
    e.portion?.id ?? null,
    e.portion?.name ?? null,
    e.portion?.gramsPerUnit ?? null,
    e.portion?.quantity ?? null,
    e.per100g.kcal,
    e.per100g.protein,
    e.per100g.carbs,
    e.per100g.fat,
    e.createdAt,
    e.updatedAt,
  ];
}

export const INSERT_ENTRY_SQL = `INSERT INTO diary_entries (id, date, meal_slot, food_kind, food_id, food_name,
  grams, portion_id, portion_name, portion_grams_per_unit, portion_quantity,
  kcal, protein, carbs, fat, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

const ORDER = "ORDER BY date ASC, created_at ASC, rowid ASC";

function assertPortion(portion: PortionSnapshot | null): void {
  assertValue(portion === null || isPortionSnapshot(portion), "invalid portion snapshot");
}

export async function listEntriesByDate(db: Db, date: string): Promise<DiaryEntry[]> {
  assertDate(date);
  const rows = await db.getAllAsync<EntryRow>(
    `SELECT * FROM diary_entries WHERE date = ? ${ORDER}`,
    [date],
  );
  return rows.map(rowToEntry);
}

/** Inclusive on both ends. */
export async function listEntriesInRange(db: Db, start: string, end: string): Promise<DiaryEntry[]> {
  assertDate(start, "start");
  assertDate(end, "end");
  const rows = await db.getAllAsync<EntryRow>(
    `SELECT * FROM diary_entries WHERE date >= ? AND date <= ? ${ORDER}`,
    [start, end],
  );
  return rows.map(rowToEntry);
}

export async function getEntry(db: Db, id: string): Promise<DiaryEntry | null> {
  const row = await db.getFirstAsync<EntryRow>("SELECT * FROM diary_entries WHERE id = ?", [id]);
  return row ? rowToEntry(row) : null;
}

export async function addEntry(db: Db, input: NewDiaryEntry): Promise<DiaryEntry> {
  assertDate(input.date);
  assertMealSlot(input.mealSlot);
  assertGrams(input.grams);
  assertValue(isFoodRef(input.food), "invalid food reference");
  assertValue(isNonEmptyString(input.foodName), "foodName is required");
  assertValue(isNutrients(input.per100g), "per100g must have 4 fields, each null or >= 0");
  assertPortion(input.portion);
  const now = nowIso();
  const entry: DiaryEntry = {
    ...input,
    food: { kind: input.food.kind, id: input.food.id },
    id: newId("entry"),
    createdAt: now,
    updatedAt: now,
  };
  await db.runAsync(INSERT_ENTRY_SQL, entryParams(entry));
  return entry;
}

/** Only date, mealSlot, grams and portion can change; `portion: null` clears it. */
export async function updateEntry(db: Db, id: string, patch: DiaryEntryPatch): Promise<DiaryEntry> {
  const existing = await getEntry(db, id);
  if (!existing) throw new DbValidationError("not_found", `diary entry ${id} not found`);
  const next: DiaryEntry = { ...existing };
  if (patch.date !== undefined) {
    assertDate(patch.date);
    next.date = patch.date;
  }
  if (patch.mealSlot !== undefined) {
    assertMealSlot(patch.mealSlot);
    next.mealSlot = patch.mealSlot;
  }
  if (patch.grams !== undefined) {
    assertGrams(patch.grams);
    next.grams = patch.grams;
  }
  if (patch.portion !== undefined) {
    assertPortion(patch.portion);
    next.portion = patch.portion;
  }
  next.updatedAt = nowIso();
  await db.runAsync(
    `UPDATE diary_entries SET date = ?, meal_slot = ?, grams = ?, portion_id = ?, portion_name = ?,
       portion_grams_per_unit = ?, portion_quantity = ?, updated_at = ? WHERE id = ?`,
    [
      next.date,
      next.mealSlot,
      next.grams,
      next.portion?.id ?? null,
      next.portion?.name ?? null,
      next.portion?.gramsPerUnit ?? null,
      next.portion?.quantity ?? null,
      next.updatedAt,
      id,
    ],
  );
  return next;
}

export async function deleteEntry(db: Db, id: string): Promise<void> {
  if (typeof id !== "string") fail("invalid_value", "id must be a string");
  await db.runAsync("DELETE FROM diary_entries WHERE id = ?", [id]);
}
