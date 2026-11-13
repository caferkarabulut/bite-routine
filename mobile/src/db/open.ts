import { openDatabaseAsync } from "expo-sqlite";
import { migrate } from "./schema";
import type { Db } from "./types";

export const DATABASE_NAME = "bite-routine.db";

let pending: Promise<Db> | null = null;

/** Opens (once per process) the on-device database and brings the schema up to date. */
export function openDatabase(): Promise<Db> {
  if (!pending) {
    const attempt = (async () => {
      const db = await openDatabaseAsync(DATABASE_NAME);
      await migrate(db);
      return db;
    })();
    pending = attempt;
    attempt.catch(() => {
      if (pending === attempt) pending = null; // allow retry after a failure
    });
  }
  return pending;
}
