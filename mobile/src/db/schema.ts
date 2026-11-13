import type { Db } from "./types";

/**
 * Ordered migrations. Index i upgrades user_version i -> i + 1.
 * Never edit a shipped migration; append a new one.
 *
 * Conventions: dates are TEXT "YYYY-MM-DD", timestamps are ISO strings,
 * nutrients are four nullable REAL columns (NULL = no data, never 0).
 */
export const MIGRATIONS: readonly string[] = [
  `
  CREATE TABLE profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    birth_year INTEGER NOT NULL,
    sex TEXT NOT NULL,
    height_cm REAL NOT NULL,
    weight_kg REAL NOT NULL,
    activity TEXT NOT NULL,
    goal TEXT NOT NULL,
    kcal_override REAL,
    protein_override REAL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    language TEXT,
    water_goal_ml REAL NOT NULL,
    reminders TEXT NOT NULL
  );

  CREATE TABLE diary_entries (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    meal_slot TEXT NOT NULL,
    food_kind TEXT NOT NULL,
    food_id TEXT NOT NULL,
    food_name TEXT NOT NULL,
    grams REAL NOT NULL,
    portion_id TEXT,
    portion_name TEXT,
    portion_grams_per_unit REAL,
    portion_quantity REAL,
    kcal REAL,
    protein REAL,
    carbs REAL,
    fat REAL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX idx_diary_entries_date ON diary_entries (date);

  CREATE TABLE custom_foods (
    id TEXT PRIMARY KEY,
    name_tr TEXT NOT NULL,
    kcal REAL,
    protein REAL,
    carbs REAL,
    fat REAL,
    portions TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE favorites (
    kind TEXT NOT NULL,
    food_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE (kind, food_id)
  );

  CREATE TABLE water_logs (
    date TEXT PRIMARY KEY,
    ml REAL NOT NULL CHECK (ml >= 0)
  );

  CREATE TABLE weight_logs (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL UNIQUE,
    kg REAL NOT NULL,
    created_at TEXT NOT NULL
  );
  `,
];

export const LATEST_SCHEMA_VERSION = MIGRATIONS.length;

/** Brings the database to the latest schema. Safe to call on every launch. */
export async function migrate(db: Db): Promise<void> {
  await db.execAsync("PRAGMA foreign_keys = ON;");
  const row = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version", []);
  const current = row?.user_version ?? 0;
  if (current > LATEST_SCHEMA_VERSION) {
    throw new Error(
      `Database schema version ${current} is newer than this app supports (${LATEST_SCHEMA_VERSION}).`,
    );
  }
  for (let version = current; version < LATEST_SCHEMA_VERSION; version += 1) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[version]);
      await db.execAsync(`PRAGMA user_version = ${version + 1}`);
    });
  }
}
