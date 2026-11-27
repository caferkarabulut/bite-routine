/** @jest-environment node */
import { addEntry, deleteCustomFood, exportBackup, getCustomFood, importBackup, listRecentFoodRefs, migrate, saveCustomFood, validateBackup } from "../src/db";
import { MIGRATIONS } from "../src/db/schema";
import { createNodeDb } from "./helpers/db-node-sqlite";

const nutrients = { kcal: 40, protein: 2, carbs: 4, fat: 1 };
async function fresh() {
  const db = createNodeDb();
  await migrate(db);
  return db;
}
it("upgrades a populated v1 database without modifying existing data", async () => {
  const db = createNodeDb();
  await db.execAsync(MIGRATIONS[0]);
  await db.execAsync("PRAGMA user_version = 1");
  await db.runAsync("INSERT INTO custom_foods VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", ["custom-old", "Old", 42, null, 2, 1, "[]", "created", "updated"]);
  await migrate(db);
  await migrate(db);
  expect(await getCustomFood(db, "custom-old")).toEqual({ id: "custom-old", nameTr: "Old", brand: null, kind: "food", per100g: { kcal: 42, protein: null, carbs: 2, fat: 1 }, portions: [], createdAt: "created", updatedAt: "updated" });
});
it("round-trips drink metadata and portions through JSON backup", async () => {
  const source = await fresh();
  const food = await saveCustomFood(source, { nameTr: "Ayran", brand: "Sütaş", kind: "drink", per100g: nutrients, portions: [{ id: "p", nameTr: "Bardak", nameEn: null, grams: 200 }] });
  const backup = JSON.parse(JSON.stringify(await exportBackup(source)));
  const target = await fresh();
  await importBackup(target, backup);
  expect(await getCustomFood(target, food.id)).toEqual(food);
});
it("restores an old backup without metadata and still accepts historical null macros", async () => {
  const source = await fresh();
  const food = await saveCustomFood(source, { nameTr: "Old", per100g: { ...nutrients, protein: null }, portions: [] });
  const backup = await exportBackup(source);
  delete backup.customFoods[0].brand;
  delete backup.customFoods[0].kind;
  expect(validateBackup(backup).ok).toBe(true);
  const target = await fresh();
  await importBackup(target, backup);
  expect(await getCustomFood(target, food.id)).toMatchObject({ brand: null, kind: "food", per100g: { protein: null } });
});
it.each([{ brand: "x".repeat(61) }, { brand: 2 }, { kind: "unknown" }, { kind: 3 }])("rejects invalid metadata before restoring: %s", async (patch) => {
  const db = await fresh();
  await saveCustomFood(db, { nameTr: "Valid", per100g: nutrients, portions: [] });
  const backup = await exportBackup(db);
  Object.assign(backup.customFoods[0], patch);
  expect(validateBackup(backup).ok).toBe(false);
  await expect(importBackup(db, backup)).rejects.toThrow();
  expect((await exportBackup(db)).customFoods[0].nameTr).toBe("Valid");
});
it("validates metadata on repository writes", async () => {
  const db = await fresh();
  await expect(saveCustomFood(db, { nameTr: "Bad", brand: "x".repeat(61), per100g: nutrients, portions: [] })).rejects.toThrow();
});
it("deduplicates by kind and id, orders by last logging, and ignores edits and diary day", async () => {
  const db = await fresh();
  const custom = await saveCustomFood(db, { nameTr: "Custom", per100g: nutrients, portions: [] });
  const refs = [{ kind: "dish" as const, id: "shared" }, { kind: "food" as const, id: "shared" }, { kind: "custom" as const, id: custom.id }, { kind: "dish" as const, id: "shared" }];
  for (const [i, ref] of refs.entries()) {
    const entry = await addEntry(db, { food: ref, date: i === 0 ? "2026-12-01" : "2026-01-01", mealSlot: "lunch", foodName: "Name", grams: 100, portion: null, per100g: nutrients });
    await db.runAsync("UPDATE diary_entries SET created_at = ?, updated_at = ? WHERE id = ?", [`2026-11-2${i}T00:00:00.000Z`, "2026-12-31T00:00:00.000Z", entry.id]);
  }
  expect(await listRecentFoodRefs(db)).toEqual([refs[3], refs[2], refs[1]]);
  await deleteCustomFood(db, custom.id);
  // Repository returns references; UI resolution discards deleted foods.
  expect(await listRecentFoodRefs(db)).toEqual([refs[3], refs[2], refs[1]]);
});
it("breaks equal logging timestamps by insertion order", async () => {
  const db = await fresh();
  for (const id of ["a", "b", "a"]) {
    const entry = await addEntry(db, { food: { kind: "dish", id }, date: "2026-01-01", mealSlot: "lunch", foodName: id, grams: 100, portion: null, per100g: nutrients });
    await db.runAsync("UPDATE diary_entries SET created_at = ? WHERE id = ?", ["2026-01-01T00:00:00.000Z", entry.id]);
  }
  expect(await listRecentFoodRefs(db)).toEqual([{ kind: "dish", id: "a" }, { kind: "dish", id: "b" }]);
});
