import type {
  BackupFile,
  CustomFood,
  DiaryEntry,
  FoodRef,
  Profile,
  Settings,
  WaterLog,
  WeightLog,
} from "../types";
import { BACKUP_SCHEMA_VERSION } from "../types";
import { DbValidationError } from "./types";
import type { Db } from "./types";
import { rowToEntry, entryParams, INSERT_ENTRY_SQL } from "./repositories/diary";
import { getProfile, assertProfileInput } from "./repositories/profile";
import type { ProfileInput } from "./repositories/profile";
import { getSettings, assertSettings } from "./repositories/settings";
import { listCustomFoods } from "./repositories/customFoods";
import { listFavorites } from "./repositories/favorites";
import { listWeights } from "./repositories/weight";
import {
  isFoodRef,
  isGrams,
  isKg,
  isLocalDate,
  isMealSlot,
  isMl,
  isNonEmptyString,
  isNutrients,
  isObject,
  isPortion,
  isPortionSnapshot,
  isTimestamp,
  nowIso,
} from "./validation";

export type BackupValidation = { ok: true; data: BackupFile } | { ok: false; errors: string[] };

const MAX_ERRORS = 50;

/** Serializes everything in the database. Lists are in a stable order. */
export async function exportBackup(db: Db): Promise<BackupFile> {
  const [profile, settings, entryRows, customFoods, favorites, waterRows, weightLogs] = await Promise.all([
    getProfile(db),
    getSettings(db),
    db.getAllAsync<Parameters<typeof rowToEntry>[0]>(
      "SELECT * FROM diary_entries ORDER BY date ASC, created_at ASC, rowid ASC",
      [],
    ),
    listCustomFoods(db),
    listFavorites(db),
    db.getAllAsync<WaterLog>("SELECT date, ml FROM water_logs ORDER BY date ASC", []),
    listWeights(db),
  ]);
  return {
    app: "bite-routine",
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: nowIso(),
    profile,
    settings,
    diaryEntries: entryRows.map(rowToEntry),
    customFoods,
    favorites,
    waterLogs: waterRows.map((r) => ({ date: r.date, ml: r.ml })),
    weightLogs,
  };
}

function checkList<T>(
  value: unknown,
  name: string,
  errors: string[],
  check: (item: unknown, path: string) => string | null,
): T[] {
  if (!Array.isArray(value)) {
    errors.push(`${name}: must be an array`);
    return [];
  }
  value.forEach((item, i) => {
    const problem = check(item, `${name}[${i}]`);
    if (problem) errors.push(problem);
  });
  return value as T[];
}

function assertionIssue(path: string, fn: () => void): string | null {
  try {
    fn();
    return null;
  } catch (e) {
    return `${path}: ${e instanceof Error ? e.message : "invalid"}`;
  }
}

function entryIssue(v: unknown, path: string): string | null {
  if (!isObject(v)) return `${path}: must be an object`;
  if (!isNonEmptyString(v.id)) return `${path}.id: required string`;
  if (!isLocalDate(v.date)) return `${path}.date: must be YYYY-MM-DD`;
  if (!isMealSlot(v.mealSlot)) return `${path}.mealSlot: invalid`;
  if (!isFoodRef(v.food)) return `${path}.food: invalid food reference`;
  if (!isNonEmptyString(v.foodName)) return `${path}.foodName: required string`;
  if (!isGrams(v.grams)) return `${path}.grams: must be > 0 and <= 10000`;
  if (v.portion !== null && !isPortionSnapshot(v.portion)) return `${path}.portion: invalid`;
  if (!isNutrients(v.per100g)) return `${path}.per100g: invalid nutrients`;
  if (!isTimestamp(v.createdAt) || !isTimestamp(v.updatedAt)) return `${path}: invalid timestamps`;
  return null;
}

function customFoodIssue(v: unknown, path: string): string | null {
  if (!isObject(v)) return `${path}: must be an object`;
  if (!isNonEmptyString(v.id)) return `${path}.id: required string`;
  if (!isNonEmptyString(v.nameTr)) return `${path}.nameTr: required string`;
  if (!isNutrients(v.per100g)) return `${path}.per100g: invalid nutrients`;
  if (!Array.isArray(v.portions) || !v.portions.every(isPortion)) return `${path}.portions: invalid`;
  if (!isTimestamp(v.createdAt) || !isTimestamp(v.updatedAt)) return `${path}: invalid timestamps`;
  return null;
}

function waterIssue(v: unknown, path: string): string | null {
  if (!isObject(v)) return `${path}: must be an object`;
  if (!isLocalDate(v.date)) return `${path}.date: must be YYYY-MM-DD`;
  if (!isMl(v.ml)) return `${path}.ml: must be 0-20000`;
  return null;
}

function weightIssue(v: unknown, path: string): string | null {
  if (!isObject(v)) return `${path}: must be an object`;
  if (!isNonEmptyString(v.id)) return `${path}.id: required string`;
  if (!isLocalDate(v.date)) return `${path}.date: must be YYYY-MM-DD`;
  if (!isKg(v.kg)) return `${path}.kg: must be 20-400`;
  if (!isTimestamp(v.createdAt)) return `${path}.createdAt: invalid timestamp`;
  return null;
}

function favoriteIssue(v: unknown, path: string): string | null {
  return isFoodRef(v) ? null : `${path}: invalid food reference`;
}

function reportDuplicates(items: unknown[], name: string, key: (item: never) => string, errors: string[]): void {
  const seen = new Set<string>();
  for (const item of items) {
    // Only called after per-item validation produced no errors for this list.
    const k = key(item as never);
    if (seen.has(k)) errors.push(`${name}: duplicate ${k}`);
    seen.add(k);
  }
}

/** Thorough structural validation of untrusted input (e.g. a parsed JSON file). */
export function validateBackup(input: unknown): BackupValidation {
  if (!isObject(input)) return { ok: false, errors: ["backup must be a JSON object"] };
  if (input.app !== "bite-routine") {
    return { ok: false, errors: ['app: not a Bite Routine backup (expected "bite-routine")'] };
  }
  const version = input.schemaVersion;
  if (!Number.isInteger(version) || (version as number) < 1) {
    return { ok: false, errors: ["schemaVersion: must be a positive integer"] };
  }
  if ((version as number) > BACKUP_SCHEMA_VERSION) {
    return {
      ok: false,
      errors: [
        `schemaVersion: ${version} is newer than this app supports (${BACKUP_SCHEMA_VERSION}); update the app`,
      ],
    };
  }

  const errors: string[] = [];
  if (!isTimestamp(input.exportedAt)) errors.push("exportedAt: invalid timestamp");

  if (input.profile !== null) {
    if (!isObject(input.profile)) errors.push("profile: must be an object or null");
    else {
      const p = input.profile;
      const issue = assertionIssue("profile", () => assertProfileInput(p as unknown as ProfileInput));
      if (issue) errors.push(issue);
      else if (!isTimestamp(p.createdAt) || !isTimestamp(p.updatedAt)) errors.push("profile: invalid timestamps");
    }
  }

  if (!isObject(input.settings)) errors.push("settings: must be an object");
  else {
    const s = input.settings;
    const issue = assertionIssue("settings", () => assertSettings(s as unknown as Settings));
    if (issue) errors.push(issue);
  }

  const entries = checkList<DiaryEntry>(input.diaryEntries, "diaryEntries", errors, entryIssue);
  const customFoods = checkList<CustomFood>(input.customFoods, "customFoods", errors, customFoodIssue);
  const favorites = checkList<FoodRef>(input.favorites, "favorites", errors, favoriteIssue);
  const waterLogs = checkList<WaterLog>(input.waterLogs, "waterLogs", errors, waterIssue);
  const weightLogs = checkList<WeightLog>(input.weightLogs, "weightLogs", errors, weightIssue);

  if (errors.length === 0) {
    reportDuplicates(entries, "diaryEntries", (e: DiaryEntry) => e.id, errors);
    reportDuplicates(customFoods, "customFoods", (e: CustomFood) => e.id, errors);
    reportDuplicates(favorites, "favorites", (e: FoodRef) => `${e.kind}:${e.id}`, errors);
    reportDuplicates(waterLogs, "waterLogs", (e: WaterLog) => e.date, errors);
    reportDuplicates(weightLogs, "weightLogs", (e: WeightLog) => e.id, errors);
    reportDuplicates(weightLogs, "weightLogs date", (e: WeightLog) => e.date, errors);
  }

  if (errors.length > 0) {
    if (errors.length > MAX_ERRORS) {
      const extra = errors.length - MAX_ERRORS;
      errors.length = MAX_ERRORS;
      errors.push(`... and ${extra} more`);
    }
    return { ok: false, errors };
  }
  return { ok: true, data: input as unknown as BackupFile };
}

const TABLES = [
  "diary_entries",
  "custom_foods",
  "favorites",
  "water_logs",
  "weight_logs",
  "profile",
  "settings",
] as const;

async function clearAll(db: Db): Promise<void> {
  for (const table of TABLES) {
    await db.runAsync(`DELETE FROM ${table}`, []);
  }
}

/** Removes all user data (one transaction). */
export async function wipeAllData(db: Db): Promise<void> {
  await db.withTransactionAsync(() => clearAll(db));
}

/**
 * Replaces all data with the backup in a single transaction. Any failure (including a
 * constraint violation midway) rolls back and leaves existing data untouched.
 */
export async function importBackup(db: Db, backup: BackupFile): Promise<void> {
  const checked = validateBackup(backup);
  if (!checked.ok) {
    throw new DbValidationError("invalid_backup", checked.errors.join("; "));
  }
  const data = checked.data;
  await db.withTransactionAsync(async () => {
    await clearAll(db);
    if (data.profile) {
      const p: Profile = data.profile;
      await db.runAsync(
        `INSERT INTO profile (id, birth_year, sex, height_cm, weight_kg, activity, goal,
           kcal_override, protein_override, created_at, updated_at)
         VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.birthYear,
          p.sex,
          p.heightCm,
          p.weightKg,
          p.activity,
          p.goal,
          p.kcalOverride,
          p.proteinOverride,
          p.createdAt,
          p.updatedAt,
        ],
      );
    }
    await db.runAsync(
      "INSERT INTO settings (id, language, water_goal_ml, reminders) VALUES (1, ?, ?, ?)",
      [data.settings.language, data.settings.waterGoalMl, JSON.stringify(data.settings.reminders)],
    );
    for (const e of data.diaryEntries) {
      await db.runAsync(INSERT_ENTRY_SQL, entryParams(e));
    }
    for (const f of data.customFoods) {
      await db.runAsync(
        `INSERT INTO custom_foods (id, name_tr, kcal, protein, carbs, fat, portions, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          f.id,
          f.nameTr,
          f.per100g.kcal,
          f.per100g.protein,
          f.per100g.carbs,
          f.per100g.fat,
          JSON.stringify(f.portions),
          f.createdAt,
          f.updatedAt,
        ],
      );
    }
    // Oldest first so listFavorites (newest first) returns the exported order.
    const base = Date.now();
    const ordered = [...data.favorites].reverse();
    for (let i = 0; i < ordered.length; i += 1) {
      await db.runAsync("INSERT INTO favorites (kind, food_id, created_at) VALUES (?, ?, ?)", [
        ordered[i].kind,
        ordered[i].id,
        new Date(base + i).toISOString(),
      ]);
    }
    for (const w of data.waterLogs) {
      await db.runAsync("INSERT INTO water_logs (date, ml) VALUES (?, ?)", [w.date, w.ml]);
    }
    for (const w of data.weightLogs) {
      await db.runAsync("INSERT INTO weight_logs (id, date, kg, created_at) VALUES (?, ?, ?, ?)", [
        w.id,
        w.date,
        w.kg,
        w.createdAt,
      ]);
    }
  });
}
