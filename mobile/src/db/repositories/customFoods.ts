import type { CustomFood, Nutrients, Portion } from "../../types";
import type { Db } from "../types";
import {
  assertValue,
  isNonEmptyString,
  isNutrients,
  isPortion,
  newId,
  nowIso,
} from "../validation";

type CustomFoodRow = {
  id: string;
  name_tr: string;
  kcal: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  portions: string;
  created_at: string;
  updated_at: string;
};

/** `id` omitted = create a new "custom-..." food; present = update (or insert with that id). */
export type CustomFoodInput = {
  id?: string;
  nameTr: string;
  per100g: Nutrients;
  portions: Portion[];
};

function parsePortions(json: string): Portion[] {
  try {
    const parsed: unknown = JSON.parse(json);
    return Array.isArray(parsed) ? (parsed as Portion[]) : [];
  } catch {
    return [];
  }
}

export function rowToCustomFood(r: CustomFoodRow): CustomFood {
  return {
    id: r.id,
    nameTr: r.name_tr,
    per100g: { kcal: r.kcal, protein: r.protein, carbs: r.carbs, fat: r.fat },
    portions: parsePortions(r.portions),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/** Most recently created first. */
export async function listCustomFoods(db: Db): Promise<CustomFood[]> {
  const rows = await db.getAllAsync<CustomFoodRow>(
    "SELECT * FROM custom_foods ORDER BY created_at DESC, rowid DESC",
    [],
  );
  return rows.map(rowToCustomFood);
}

export async function getCustomFood(db: Db, id: string): Promise<CustomFood | null> {
  const row = await db.getFirstAsync<CustomFoodRow>("SELECT * FROM custom_foods WHERE id = ?", [id]);
  return row ? rowToCustomFood(row) : null;
}

export async function saveCustomFood(db: Db, input: CustomFoodInput): Promise<CustomFood> {
  assertValue(isNonEmptyString(input.nameTr), "nameTr is required");
  assertValue(isNutrients(input.per100g), "per100g must have 4 fields, each null or >= 0");
  assertValue(Array.isArray(input.portions) && input.portions.every(isPortion), "invalid portions");
  assertValue(input.id === undefined || isNonEmptyString(input.id), "invalid id");
  const id = input.id ?? newId("custom");
  const now = nowIso();
  const portions = input.portions.map((p) => ({
    id: p.id,
    nameTr: p.nameTr,
    nameEn: p.nameEn,
    grams: p.grams,
  }));
  await db.runAsync(
    `INSERT INTO custom_foods (id, name_tr, kcal, protein, carbs, fat, portions, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name_tr = excluded.name_tr, kcal = excluded.kcal, protein = excluded.protein,
       carbs = excluded.carbs, fat = excluded.fat, portions = excluded.portions,
       updated_at = excluded.updated_at`,
    [
      id,
      input.nameTr,
      input.per100g.kcal,
      input.per100g.protein,
      input.per100g.carbs,
      input.per100g.fat,
      JSON.stringify(portions),
      now,
      now,
    ],
  );
  return (await getCustomFood(db, id)) as CustomFood;
}

/** Diary entries keep their own snapshot, so history is untouched. Favorites of it are removed. */
export async function deleteCustomFood(db: Db, id: string): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM custom_foods WHERE id = ?", [id]);
    await db.runAsync("DELETE FROM favorites WHERE kind = 'custom' AND food_id = ?", [id]);
  });
}
