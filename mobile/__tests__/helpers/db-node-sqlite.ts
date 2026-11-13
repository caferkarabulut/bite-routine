import { DatabaseSync } from "node:sqlite";
import type { SQLInputValue } from "node:sqlite";
import type { Db } from "../../src/db/types";

/** Db adapter over Node's built-in SQLite so tests run real SQL. */
export function createNodeDb(path = ":memory:"): Db & { raw: DatabaseSync } {
  const raw = new DatabaseSync(path);
  raw.exec("PRAGMA foreign_keys = ON;");
  let depth = 0;
  return {
    raw,
    async execAsync(source) {
      raw.exec(source);
    },
    async runAsync(source, params) {
      const r = raw.prepare(source).run(...(params as SQLInputValue[]));
      return { lastInsertRowId: Number(r.lastInsertRowid), changes: Number(r.changes) };
    },
    async getAllAsync<T>(source: string, params: (string | number | null)[]) {
      const rows = raw.prepare(source).all(...(params as SQLInputValue[]));
      return rows.map((r) => ({ ...r })) as T[];
    },
    async getFirstAsync<T>(source: string, params: (string | number | null)[]) {
      const row = raw.prepare(source).get(...(params as SQLInputValue[]));
      return row ? ({ ...row } as T) : null;
    },
    async withTransactionAsync(task) {
      if (depth > 0) throw new Error("nested transactions are not supported");
      raw.exec("BEGIN");
      depth += 1;
      try {
        await task();
        raw.exec("COMMIT");
      } catch (e) {
        raw.exec("ROLLBACK");
        throw e;
      } finally {
        depth -= 1;
      }
    },
  };
}
