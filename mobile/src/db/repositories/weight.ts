import type { WeightLog } from "../../types";
import type { Db } from "../types";
import { assertDate, assertKg, newId, nowIso } from "../validation";

type WeightRow = { id: string; date: string; kg: number; created_at: string };

export function rowToWeight(r: WeightRow): WeightLog {
  return { id: r.id, date: r.date, kg: r.kg, createdAt: r.created_at };
}

/** Oldest first (chart order). */
export async function listWeights(db: Db): Promise<WeightLog[]> {
  const rows = await db.getAllAsync<WeightRow>("SELECT * FROM weight_logs ORDER BY date ASC", []);
  return rows.map(rowToWeight);
}

/** One entry per day: a second call for the same date updates kg and keeps id/createdAt. */
export async function addWeight(db: Db, date: string, kg: number): Promise<WeightLog> {
  assertDate(date);
  assertKg(kg);
  await db.runAsync(
    `INSERT INTO weight_logs (id, date, kg, created_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET kg = excluded.kg`,
    [newId("weight"), date, kg, nowIso()],
  );
  const row = await db.getFirstAsync<WeightRow>("SELECT * FROM weight_logs WHERE date = ?", [date]);
  return rowToWeight(row as WeightRow);
}

export async function deleteWeight(db: Db, id: string): Promise<void> {
  await db.runAsync("DELETE FROM weight_logs WHERE id = ?", [id]);
}
