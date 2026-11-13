import type { Db } from "../types";
import { MAX_ML, assertDate, assertMl, assertValue, isFiniteNumber } from "../validation";

/** Total ml for the day; 0 when nothing was logged. */
export async function getWater(db: Db, date: string): Promise<number> {
  assertDate(date);
  const row = await db.getFirstAsync<{ ml: number }>("SELECT ml FROM water_logs WHERE date = ?", [date]);
  return row?.ml ?? 0;
}

export async function setWater(db: Db, date: string, ml: number): Promise<number> {
  assertDate(date);
  assertMl(ml);
  await db.runAsync(
    "INSERT INTO water_logs (date, ml) VALUES (?, ?) ON CONFLICT(date) DO UPDATE SET ml = excluded.ml",
    [date, ml],
  );
  return ml;
}

/** Adds (or subtracts) ml; the daily total is clamped to 0..20000 and never goes below 0. */
export async function addWater(db: Db, date: string, deltaMl: number): Promise<number> {
  assertDate(date);
  assertValue(isFiniteNumber(deltaMl) && Math.abs(deltaMl) <= MAX_ML, "deltaMl must be a finite number within +-20000");
  await db.runAsync(
    `INSERT INTO water_logs (date, ml) VALUES (?, MAX(0, MIN(${MAX_ML}, ?)))
     ON CONFLICT(date) DO UPDATE SET ml = MAX(0, MIN(${MAX_ML}, ml + ?))`,
    [date, deltaMl, deltaMl],
  );
  return getWater(db, date);
}
