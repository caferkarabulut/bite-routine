/**
 * @jest-environment node
 */
import { LATEST_SCHEMA_VERSION, migrate } from "../src/db/schema";
import { createNodeDb } from "./helpers/db-node-sqlite";

const TABLES = ["custom_foods", "diary_entries", "favorites", "profile", "settings", "water_logs", "weight_logs"];

async function tableNames(db: ReturnType<typeof createNodeDb>) {
  const rows = await db.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    [],
  );
  return rows.map((r) => r.name);
}

describe("migrate", () => {
  it("creates the version 1 schema on an empty database", async () => {
    const db = createNodeDb();
    await migrate(db);
    expect(await tableNames(db)).toEqual(TABLES);
    const v = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version", []);
    expect(v?.user_version).toBe(LATEST_SCHEMA_VERSION);
    const fk = await db.getFirstAsync<{ foreign_keys: number }>("PRAGMA foreign_keys", []);
    expect(fk?.foreign_keys).toBe(1);
    const idx = await db.getAllAsync<{ name: string }>("PRAGMA index_list(diary_entries)", []);
    expect(idx.map((i) => i.name)).toContain("idx_diary_entries_date");
  });

  it("is idempotent and keeps existing data", async () => {
    const db = createNodeDb();
    await migrate(db);
    await db.runAsync("INSERT INTO water_logs (date, ml) VALUES (?, ?)", ["2026-01-01", 500]);
    await migrate(db);
    await migrate(db);
    expect(await tableNames(db)).toEqual(TABLES);
    const row = await db.getFirstAsync<{ ml: number }>("SELECT ml FROM water_logs", []);
    expect(row?.ml).toBe(500);
  });

  it("refuses a database from a newer app version", async () => {
    const db = createNodeDb();
    await db.execAsync(`PRAGMA user_version = ${LATEST_SCHEMA_VERSION + 1}`);
    await expect(migrate(db)).rejects.toThrow(/newer/);
  });

  it("enforces unique favorites and one weight per date at the SQL level", async () => {
    const db = createNodeDb();
    await migrate(db);
    await db.runAsync("INSERT INTO favorites (kind, food_id, created_at) VALUES ('dish','a','t')", []);
    await expect(
      db.runAsync("INSERT INTO favorites (kind, food_id, created_at) VALUES ('dish','a','t')", []),
    ).rejects.toThrow();
    await db.runAsync("INSERT INTO weight_logs (id, date, kg, created_at) VALUES ('1','2026-01-01',70,'t')", []);
    await expect(
      db.runAsync("INSERT INTO weight_logs (id, date, kg, created_at) VALUES ('2','2026-01-01',71,'t')", []),
    ).rejects.toThrow();
  });
});
