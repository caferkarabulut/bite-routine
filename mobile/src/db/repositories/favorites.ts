import type { FoodRef } from "../../types";
import type { Db } from "../types";
import { assertValue, isFoodRef, nowIso } from "../validation";

/** Most recently added first. */
export async function listFavorites(db: Db): Promise<FoodRef[]> {
  const rows = await db.getAllAsync<{ kind: string; food_id: string }>(
    "SELECT kind, food_id FROM favorites ORDER BY created_at DESC, rowid DESC",
    [],
  );
  return rows.map((r) => ({ kind: r.kind, id: r.food_id }) as FoodRef);
}

/** Idempotent: adding an existing favorite is a no-op. */
export async function addFavorite(db: Db, ref: FoodRef): Promise<void> {
  assertValue(isFoodRef(ref), "invalid food reference");
  await db.runAsync(
    "INSERT OR IGNORE INTO favorites (kind, food_id, created_at) VALUES (?, ?, ?)",
    [ref.kind, ref.id, nowIso()],
  );
}

export async function removeFavorite(db: Db, ref: FoodRef): Promise<void> {
  assertValue(isFoodRef(ref), "invalid food reference");
  await db.runAsync("DELETE FROM favorites WHERE kind = ? AND food_id = ?", [ref.kind, ref.id]);
}

export async function isFavorite(db: Db, ref: FoodRef): Promise<boolean> {
  assertValue(isFoodRef(ref), "invalid food reference");
  const row = await db.getFirstAsync<{ n: number }>(
    "SELECT 1 AS n FROM favorites WHERE kind = ? AND food_id = ?",
    [ref.kind, ref.id],
  );
  return row !== null;
}
