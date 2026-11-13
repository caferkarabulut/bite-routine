/**
 * @jest-environment node
 */
import {
  DbValidationError,
  addEntry,
  addFavorite,
  addWater,
  addWeight,
  exportBackup,
  getProfile,
  getSettings,
  importBackup,
  listCustomFoods,
  listEntriesInRange,
  listFavorites,
  listWeights,
  migrate,
  saveCustomFood,
  saveProfile,
  saveSettings,
  validateBackup,
  wipeAllData,
} from "../src/db";
import type { BackupFile } from "../src/types";
import { BACKUP_SCHEMA_VERSION } from "../src/types";
import { createNodeDb } from "./helpers/db-node-sqlite";

async function freshDb() {
  const db = createNodeDb();
  await migrate(db);
  return db;
}

async function populate(db: Awaited<ReturnType<typeof freshDb>>) {
  await saveProfile(db, {
    birthYear: 1990,
    sex: "male",
    heightCm: 180.5,
    weightKg: 80.25,
    activity: "moderate",
    goal: "lose",
    kcalOverride: 2100,
    proteinOverride: null,
  });
  await saveSettings(db, {
    language: "tr",
    waterGoalMl: 2400,
    reminders: [{ id: "r1", kind: "water", mealSlot: null, hour: 10, minute: 15, enabled: true }],
  });
  const cf = await saveCustomFood(db, {
    nameTr: "Pekmezli ekmek",
    per100g: { kcal: 280.5, protein: null, carbs: 60.1, fat: 1 },
    portions: [{ id: "d", nameTr: "1 dilim", nameEn: "1 slice", grams: 30.5 }],
  });
  await addEntry(db, {
    date: "2026-03-10",
    mealSlot: "breakfast",
    food: { kind: "custom", id: cf.id },
    foodName: cf.nameTr,
    grams: 61,
    portion: { id: "d", name: "1 dilim", gramsPerUnit: 30.5, quantity: 2 },
    per100g: cf.per100g,
  });
  await addEntry(db, {
    date: "2026-03-11",
    mealSlot: "dinner",
    food: { kind: "dish", id: "karniyarik" },
    foodName: "Karnıyarık",
    grams: 333.3,
    portion: null,
    per100g: { kcal: null, protein: null, carbs: null, fat: null },
  });
  await addFavorite(db, { kind: "dish", id: "karniyarik" });
  await addFavorite(db, { kind: "custom", id: cf.id });
  await addWater(db, "2026-03-10", 1250.5);
  await addWeight(db, "2026-03-10", 80.25);
  await addWeight(db, "2026-03-12", 79.9);
}

async function snapshot(db: Awaited<ReturnType<typeof freshDb>>) {
  const b = await exportBackup(db);
  return { ...b, exportedAt: "" };
}

function clone(b: BackupFile): Record<string, unknown> {
  return JSON.parse(JSON.stringify(b)) as Record<string, unknown>;
}

describe("backup", () => {
  it("exports an empty database", async () => {
    const db = await freshDb();
    const b = await exportBackup(db);
    expect(b).toMatchObject({
      app: "bite-routine",
      schemaVersion: BACKUP_SCHEMA_VERSION,
      profile: null,
      settings: { language: null, waterGoalMl: 2000, reminders: [] },
      diaryEntries: [],
      customFoods: [],
      favorites: [],
      waterLogs: [],
      weightLogs: [],
    });
    expect(validateBackup(b).ok).toBe(true);
  });

  it("export -> JSON -> validate -> import into a fresh DB yields identical data", async () => {
    const source = await freshDb();
    await populate(source);
    const exported = await exportBackup(source);
    expect(exported.diaryEntries).toHaveLength(2);
    expect(exported.favorites).toHaveLength(2);

    const parsed: unknown = JSON.parse(JSON.stringify(exported));
    const result = validateBackup(parsed);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const target = await freshDb();
    await importBackup(target, result.data);
    expect(await snapshot(target)).toEqual(await snapshot(source));
    expect(await getProfile(target)).toEqual(await getProfile(source));
    expect(await getSettings(target)).toEqual(await getSettings(source));
    expect(await listFavorites(target)).toEqual(await listFavorites(source));
    expect(await listWeights(target)).toEqual(await listWeights(source));
    expect(await listCustomFoods(target)).toEqual(await listCustomFoods(source));
    expect(await listEntriesInRange(target, "2026-03-01", "2026-03-31")).toEqual(
      await listEntriesInRange(source, "2026-03-01", "2026-03-31"),
    );
  });

  it("import replaces existing data", async () => {
    const source = await freshDb();
    await populate(source);
    const backup = await exportBackup(source);

    const target = await freshDb();
    await addWater(target, "2020-01-01", 500);
    await addWeight(target, "2020-01-01", 60);
    await addFavorite(target, { kind: "food", id: "old" });
    await importBackup(target, backup);
    expect(await snapshot(target)).toEqual(await snapshot(source));
  });

  it("imports a backup with no profile, wiping an existing profile", async () => {
    const target = await freshDb();
    await populate(target);
    const empty = await exportBackup(await freshDb());
    await importBackup(target, empty);
    expect(await getProfile(target)).toBeNull();
    expect(await snapshot(target)).toEqual({ ...empty, exportedAt: "" });
  });

  describe("validateBackup rejects", () => {
    async function valid(): Promise<BackupFile> {
      const db = await freshDb();
      await populate(db);
      return exportBackup(db);
    }

    function errorsOf(input: unknown): string[] {
      const r = validateBackup(input);
      if (r.ok) throw new Error("expected rejection");
      expect(r.errors.length).toBeGreaterThan(0);
      return r.errors;
    }

    it("non-objects", () => {
      for (const v of [null, undefined, 42, "x", [], true]) errorsOf(v);
    });

    it("other apps", async () => {
      const b = clone(await valid());
      b.app = "other-app";
      expect(errorsOf(b)[0]).toMatch(/not a Bite Routine backup/);
      delete b.app;
      errorsOf(b);
    });

    it("newer schema versions and bad version values", async () => {
      const b = clone(await valid());
      b.schemaVersion = BACKUP_SCHEMA_VERSION + 1;
      expect(errorsOf(b)[0]).toMatch(/newer/);
      b.schemaVersion = 0;
      errorsOf(b);
      b.schemaVersion = "1";
      errorsOf(b);
    });

    it("missing or malformed sections", async () => {
      const base = clone(await valid());
      for (const key of ["settings", "diaryEntries", "customFoods", "favorites", "waterLogs", "weightLogs"]) {
        const b = { ...base };
        delete b[key];
        expect(errorsOf(b).join(" ")).toContain(key);
      }
      errorsOf({ ...base, diaryEntries: {} });
      errorsOf({ ...base, profile: "x" });
      errorsOf({ ...base, exportedAt: "yesterday" });
    });

    it("bad field values inside records", async () => {
      const base = await valid();
      const mutate = (fn: (b: BackupFile) => void) => {
        const b = JSON.parse(JSON.stringify(base)) as BackupFile;
        fn(b);
        return errorsOf(b).join(" ");
      };
      expect(mutate((b) => (b.diaryEntries[0].grams = 0))).toContain("diaryEntries[0].grams");
      expect(mutate((b) => (b.diaryEntries[0].grams = 20000))).toContain("grams");
      expect(mutate((b) => (b.diaryEntries[1].date = "2026-13-01"))).toContain("diaryEntries[1].date");
      expect(mutate((b) => (b.diaryEntries[0].mealSlot = "x" as never))).toContain("mealSlot");
      expect(mutate((b) => (b.diaryEntries[0].per100g.kcal = "5" as never))).toContain("per100g");
      expect(mutate((b) => (b.diaryEntries[0].per100g.fat = -1))).toContain("per100g");
      expect(mutate((b) => (b.diaryEntries[0].food = { kind: "x", id: "a" } as never))).toContain("food");
      expect(mutate((b) => (b.waterLogs[0].ml = -5))).toContain("waterLogs[0].ml");
      expect(mutate((b) => (b.weightLogs[0].kg = 5))).toContain("weightLogs[0].kg");
      expect(mutate((b) => (b.profile!.weightKg = 1000))).toContain("profile");
      expect(mutate((b) => (b.settings.language = "de" as never))).toContain("settings");
      expect(mutate((b) => (b.customFoods[0].portions[0].grams = -1))).toContain("customFoods[0].portions");
      expect(mutate((b) => (b.favorites[0] = { kind: "dish" } as never))).toContain("favorites[0]");
    });

    it("duplicates that would violate constraints", async () => {
      const base = await valid();
      const mutate = (fn: (b: BackupFile) => void) => {
        const b = JSON.parse(JSON.stringify(base)) as BackupFile;
        fn(b);
        return errorsOf(b).join(" ");
      };
      expect(mutate((b) => b.diaryEntries.push(b.diaryEntries[0]))).toContain("duplicate");
      expect(mutate((b) => b.favorites.push(b.favorites[0]))).toContain("duplicate");
      expect(mutate((b) => b.waterLogs.push(b.waterLogs[0]))).toContain("duplicate");
      expect(mutate((b) => b.weightLogs.push({ ...b.weightLogs[0], id: "other" }))).toContain("duplicate");
    });

    it("accepts what it should", async () => {
      const r = validateBackup(await valid());
      expect(r.ok).toBe(true);
    });
  });

  describe("importBackup leaves existing data untouched on failure", () => {
    it("rejects invalid, foreign and newer files", async () => {
      const db = await freshDb();
      await populate(db);
      const before = await snapshot(db);
      const good = await exportBackup(db);

      const foreign = { ...good, app: "x" } as unknown as BackupFile;
      const newer = { ...good, schemaVersion: BACKUP_SCHEMA_VERSION + 1 };
      const invalid = { ...good, diaryEntries: [{ id: "x" }] } as unknown as BackupFile;
      for (const bad of [foreign, newer, invalid]) {
        await expect(importBackup(db, bad)).rejects.toMatchObject({ code: "invalid_backup" });
        await expect(importBackup(db, bad)).rejects.toBeInstanceOf(DbValidationError);
      }
      expect(await snapshot(db)).toEqual(before);
    });

    it("rolls back when a statement fails midway", async () => {
      const db = await freshDb();
      await populate(db);
      const before = await snapshot(db);
      const other = await freshDb();
      await populate(other);
      const backup = await exportBackup(other);

      // Make the very last insert (weight_logs) fail after everything else was written.
      await db.execAsync(
        "CREATE TRIGGER fail_weight BEFORE INSERT ON weight_logs BEGIN SELECT RAISE(ABORT, 'boom'); END;",
      );
      await expect(importBackup(db, backup)).rejects.toThrow(/boom/);
      await db.execAsync("DROP TRIGGER fail_weight");
      expect(await snapshot(db)).toEqual(before);
    });
  });

  describe("wipeAllData", () => {
    it("removes everything and leaves a working database", async () => {
      const db = await freshDb();
      await populate(db);
      await wipeAllData(db);
      const b = await exportBackup(db);
      expect(b).toMatchObject({
        profile: null,
        settings: { language: null, waterGoalMl: 2000, reminders: [] },
        diaryEntries: [],
        customFoods: [],
        favorites: [],
        waterLogs: [],
        weightLogs: [],
      });
      await addWater(db, "2026-03-10", 100);
      expect((await exportBackup(db)).waterLogs).toEqual([{ date: "2026-03-10", ml: 100 }]);
    });
  });
});
