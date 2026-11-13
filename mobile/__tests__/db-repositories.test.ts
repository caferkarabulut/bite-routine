/**
 * @jest-environment node
 */
import {
  DbValidationError,
  addEntry,
  addFavorite,
  addWater,
  addWeight,
  deleteCustomFood,
  deleteEntry,
  deleteWeight,
  getCustomFood,
  getProfile,
  getSettings,
  getWater,
  isFavorite,
  listCustomFoods,
  listEntriesByDate,
  listEntriesInRange,
  listFavorites,
  listWeights,
  migrate,
  removeFavorite,
  saveCustomFood,
  saveProfile,
  saveSettings,
  setWater,
  updateEntry,
} from "../src/db";
import type { NewDiaryEntry } from "../src/types";
import { createNodeDb } from "./helpers/db-node-sqlite";

async function freshDb() {
  const db = createNodeDb();
  await migrate(db);
  return db;
}

function newEntry(over: Partial<NewDiaryEntry> = {}): NewDiaryEntry {
  return {
    date: "2026-03-10",
    mealSlot: "lunch",
    food: { kind: "dish", id: "mercimek-corbasi" },
    foodName: "Mercimek çorbası",
    grams: 250,
    portion: null,
    per100g: { kcal: 62.5, protein: 3.1, carbs: 9.2, fat: 1.4 },
    ...over,
  };
}

async function codeOf(p: Promise<unknown>): Promise<string> {
  try {
    await p;
  } catch (e) {
    if (e instanceof DbValidationError) return e.code;
    throw e;
  }
  return "no error";
}

describe("profile", () => {
  const input = {
    birthYear: 1994,
    sex: "female" as const,
    heightCm: 168.5,
    weightKg: 62.3,
    activity: "light" as const,
    goal: "maintain" as const,
    kcalOverride: null,
    proteinOverride: 95.5,
  };

  it("returns null before saving, then round-trips with decimals and nulls", async () => {
    const db = await freshDb();
    expect(await getProfile(db)).toBeNull();
    const saved = await saveProfile(db, input);
    expect(saved).toMatchObject(input);
    expect(await getProfile(db)).toEqual(saved);
  });

  it("keeps a single row and createdAt on update", async () => {
    const db = await freshDb();
    const first = await saveProfile(db, input);
    const second = await saveProfile(db, { ...input, weightKg: 61.9, goal: "lose" });
    expect(second.weightKg).toBe(61.9);
    expect(second.createdAt).toBe(first.createdAt);
    const count = await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM profile", []);
    expect(count?.n).toBe(1);
  });

  it("validates weight and enums", async () => {
    const db = await freshDb();
    expect(await codeOf(saveProfile(db, { ...input, weightKg: 19 }))).toBe("invalid_kg");
    expect(await codeOf(saveProfile(db, { ...input, sex: "x" as never }))).toBe("invalid_value");
    expect(await getProfile(db)).toBeNull();
  });
});

describe("diary", () => {
  it("round-trips an entry including null nutrients and decimal grams", async () => {
    const db = await freshDb();
    const added = await addEntry(
      db,
      newEntry({
        grams: 33.33,
        per100g: { kcal: null, protein: 0, carbs: null, fat: 1.25 },
        portion: { id: "p1", name: "1 kase", gramsPerUnit: 11.11, quantity: 3 },
      }),
    );
    const [got] = await listEntriesByDate(db, "2026-03-10");
    expect(got).toEqual(added);
    expect(got.grams).toBe(33.33);
    expect(got.per100g).toEqual({ kcal: null, protein: 0, carbs: null, fat: 1.25 });
    expect(got.portion).toEqual({ id: "p1", name: "1 kase", gramsPerUnit: 11.11, quantity: 3 });
    expect(got.id).toMatch(/^entry-/);
  });

  it("lists by date in insertion order", async () => {
    const db = await freshDb();
    const a = await addEntry(db, newEntry({ foodName: "A" }));
    const b = await addEntry(db, newEntry({ foodName: "B" }));
    await addEntry(db, newEntry({ date: "2026-03-11" }));
    expect((await listEntriesByDate(db, "2026-03-10")).map((e) => e.id)).toEqual([a.id, b.id]);
  });

  it("listEntriesInRange is inclusive on both ends", async () => {
    const db = await freshDb();
    for (const d of ["2026-03-09", "2026-03-10", "2026-03-12", "2026-03-13"]) {
      await addEntry(db, newEntry({ date: d }));
    }
    const dates = (await listEntriesInRange(db, "2026-03-10", "2026-03-12")).map((e) => e.date);
    expect(dates).toEqual(["2026-03-10", "2026-03-12"]);
    expect(await listEntriesInRange(db, "2026-03-12", "2026-03-10")).toEqual([]);
    expect(await listEntriesInRange(db, "2026-03-10", "2026-03-10")).toHaveLength(1);
  });

  it("updates date, mealSlot, grams and portion; clears portion with null", async () => {
    const db = await freshDb();
    const e = await addEntry(
      db,
      newEntry({ portion: { id: "p", name: "dilim", gramsPerUnit: 50, quantity: 2 }, grams: 100 }),
    );
    const u = await updateEntry(db, e.id, { grams: 75.5, mealSlot: "dinner", date: "2026-03-11" });
    expect(u).toMatchObject({ grams: 75.5, mealSlot: "dinner", date: "2026-03-11" });
    expect(u.portion).toEqual(e.portion);
    const cleared = await updateEntry(db, e.id, { portion: null });
    expect(cleared.portion).toBeNull();
    expect(await listEntriesByDate(db, "2026-03-10")).toEqual([]);
    expect((await listEntriesByDate(db, "2026-03-11"))[0]).toEqual(cleared);
    expect(cleared.foodName).toBe(e.foodName);
    expect(cleared.per100g).toEqual(e.per100g);
  });

  it("deletes entries", async () => {
    const db = await freshDb();
    const e = await addEntry(db, newEntry());
    await deleteEntry(db, e.id);
    expect(await listEntriesByDate(db, "2026-03-10")).toEqual([]);
    await deleteEntry(db, "missing");
  });

  it("validates input at the boundary", async () => {
    const db = await freshDb();
    expect(await codeOf(addEntry(db, newEntry({ grams: 0 })))).toBe("invalid_grams");
    expect(await codeOf(addEntry(db, newEntry({ grams: -5 })))).toBe("invalid_grams");
    expect(await codeOf(addEntry(db, newEntry({ grams: 10000.01 })))).toBe("invalid_grams");
    expect(await codeOf(addEntry(db, newEntry({ grams: NaN })))).toBe("invalid_grams");
    expect(await addEntry(db, newEntry({ grams: 10000 }))).toBeTruthy();
    expect(await codeOf(addEntry(db, newEntry({ mealSlot: "brunch" as never })))).toBe("invalid_meal_slot");
    expect(await codeOf(addEntry(db, newEntry({ date: "2026-3-1" })))).toBe("invalid_date");
    expect(await codeOf(addEntry(db, newEntry({ date: "2026-02-30" })))).toBe("invalid_date");
    expect(await codeOf(addEntry(db, newEntry({ foodName: " " })))).toBe("invalid_value");
    expect(await codeOf(addEntry(db, newEntry({ per100g: { kcal: -1, protein: null, carbs: null, fat: null } })))).toBe(
      "invalid_value",
    );
    expect(await codeOf(listEntriesByDate(db, "bad"))).toBe("invalid_date");
    expect(await codeOf(listEntriesInRange(db, "2026-01-01", "x"))).toBe("invalid_date");
    const e = await addEntry(db, newEntry());
    expect(await codeOf(updateEntry(db, e.id, { grams: 0 }))).toBe("invalid_grams");
    expect(await codeOf(updateEntry(db, e.id, { mealSlot: "x" as never }))).toBe("invalid_meal_slot");
    expect(await codeOf(updateEntry(db, "nope", { grams: 5 }))).toBe("not_found");
    expect((await listEntriesByDate(db, "2026-03-10")).find((x) => x.id === e.id)?.grams).toBe(250);
  });
});

describe("custom foods", () => {
  const food = {
    nameTr: "Ev yapımı granola",
    per100g: { kcal: 450.5, protein: null, carbs: 60, fat: null },
    portions: [{ id: "k", nameTr: "1 kase", nameEn: null, grams: 40.5 }],
  };

  it("creates, lists, gets, updates and keeps null nutrients", async () => {
    const db = await freshDb();
    const created = await saveCustomFood(db, food);
    expect(created.id).toMatch(/^custom-/);
    expect(created.per100g).toEqual(food.per100g);
    expect(created.portions).toEqual(food.portions);
    expect(await getCustomFood(db, created.id)).toEqual(created);
    expect(await getCustomFood(db, "custom-missing")).toBeNull();

    const updated = await saveCustomFood(db, { ...food, id: created.id, nameTr: "Granola 2" });
    expect(updated.id).toBe(created.id);
    expect(updated.nameTr).toBe("Granola 2");
    expect(updated.createdAt).toBe(created.createdAt);
    expect(await listCustomFoods(db)).toHaveLength(1);
  });

  it("validates", async () => {
    const db = await freshDb();
    expect(await codeOf(saveCustomFood(db, { ...food, nameTr: "" }))).toBe("invalid_value");
    expect(
      await codeOf(saveCustomFood(db, { ...food, portions: [{ id: "x", nameTr: "a", nameEn: null, grams: 0 }] })),
    ).toBe("invalid_value");
    expect(await listCustomFoods(db)).toEqual([]);
  });

  it("deleting a custom food leaves diary snapshots intact", async () => {
    const db = await freshDb();
    const cf = await saveCustomFood(db, food);
    const entry = await addEntry(
      db,
      newEntry({ food: { kind: "custom", id: cf.id }, foodName: cf.nameTr, per100g: cf.per100g }),
    );
    await addFavorite(db, { kind: "custom", id: cf.id });
    await deleteCustomFood(db, cf.id);
    expect(await getCustomFood(db, cf.id)).toBeNull();
    expect(await listEntriesByDate(db, entry.date)).toEqual([entry]);
    expect(await isFavorite(db, { kind: "custom", id: cf.id })).toBe(false);
  });
});

describe("favorites", () => {
  it("adds idempotently, lists, checks and removes", async () => {
    const db = await freshDb();
    const a = { kind: "dish" as const, id: "a" };
    const b = { kind: "food" as const, id: "a" };
    expect(await isFavorite(db, a)).toBe(false);
    await addFavorite(db, a);
    await addFavorite(db, a);
    await addFavorite(db, b);
    expect(await listFavorites(db)).toEqual([b, a]);
    expect(await isFavorite(db, a)).toBe(true);
    await removeFavorite(db, a);
    expect(await isFavorite(db, a)).toBe(false);
    expect(await isFavorite(db, b)).toBe(true);
    await removeFavorite(db, a);
  });

  it("rejects invalid refs", async () => {
    const db = await freshDb();
    expect(await codeOf(addFavorite(db, { kind: "x" as never, id: "a" }))).toBe("invalid_value");
    expect(await codeOf(addFavorite(db, { kind: "dish", id: "" }))).toBe("invalid_value");
  });
});

describe("water", () => {
  it("defaults to 0, sets and adds", async () => {
    const db = await freshDb();
    expect(await getWater(db, "2026-03-10")).toBe(0);
    expect(await setWater(db, "2026-03-10", 750)).toBe(750);
    expect(await addWater(db, "2026-03-10", 250.5)).toBe(1000.5);
    expect(await getWater(db, "2026-03-10")).toBe(1000.5);
    expect(await getWater(db, "2026-03-11")).toBe(0);
  });

  it("addWater never goes below 0, on existing or missing days", async () => {
    const db = await freshDb();
    expect(await addWater(db, "2026-03-10", -300)).toBe(0);
    await setWater(db, "2026-03-11", 200);
    expect(await addWater(db, "2026-03-11", -500)).toBe(0);
  });

  it("addWater caps at 20000 and validates", async () => {
    const db = await freshDb();
    await setWater(db, "2026-03-10", 19900);
    expect(await addWater(db, "2026-03-10", 500)).toBe(20000);
    expect(await codeOf(setWater(db, "2026-03-10", -1))).toBe("invalid_ml");
    expect(await codeOf(setWater(db, "2026-03-10", 20001))).toBe("invalid_ml");
    expect(await codeOf(setWater(db, "bad", 5))).toBe("invalid_date");
    expect(await codeOf(addWater(db, "2026-03-10", NaN))).toBe("invalid_value");
    expect(await getWater(db, "2026-03-10")).toBe(20000);
  });
});

describe("weight", () => {
  it("adds, lists oldest first, updates same-day, deletes", async () => {
    const db = await freshDb();
    const w2 = await addWeight(db, "2026-03-12", 70.4);
    const w1 = await addWeight(db, "2026-03-10", 71);
    expect((await listWeights(db)).map((w) => w.date)).toEqual(["2026-03-10", "2026-03-12"]);

    const again = await addWeight(db, "2026-03-12", 69.85);
    expect(again.id).toBe(w2.id);
    expect(again.kg).toBe(69.85);
    expect(again.createdAt).toBe(w2.createdAt);
    expect(await listWeights(db)).toHaveLength(2);

    await deleteWeight(db, w1.id);
    expect((await listWeights(db)).map((w) => w.id)).toEqual([w2.id]);
  });

  it("validates kg 20-400", async () => {
    const db = await freshDb();
    expect(await codeOf(addWeight(db, "2026-03-10", 19.9))).toBe("invalid_kg");
    expect(await codeOf(addWeight(db, "2026-03-10", 400.1))).toBe("invalid_kg");
    expect(await codeOf(addWeight(db, "2026-03-10", NaN))).toBe("invalid_kg");
    expect(await codeOf(addWeight(db, "10.03.2026", 70))).toBe("invalid_date");
    expect((await addWeight(db, "2026-03-10", 20)).kg).toBe(20);
    expect((await addWeight(db, "2026-03-11", 400)).kg).toBe(400);
  });
});

describe("settings", () => {
  it("returns defaults when unsaved", async () => {
    const db = await freshDb();
    expect(await getSettings(db)).toEqual({ language: null, waterGoalMl: 2000, reminders: [] });
  });

  it("round-trips language, goal and reminders", async () => {
    const db = await freshDb();
    const settings = {
      language: "en" as const,
      waterGoalMl: 2750.5,
      reminders: [
        { id: "r1", kind: "meal" as const, mealSlot: "breakfast" as const, hour: 8, minute: 30, enabled: true },
        { id: "r2", kind: "water" as const, mealSlot: null, hour: 15, minute: 0, enabled: false },
      ],
    };
    expect(await saveSettings(db, settings)).toEqual(settings);
    expect(await getSettings(db)).toEqual(settings);
    await saveSettings(db, { ...settings, language: null, reminders: [] });
    expect(await getSettings(db)).toEqual({ language: null, waterGoalMl: 2750.5, reminders: [] });
  });

  it("validates", async () => {
    const db = await freshDb();
    const base = { language: null, waterGoalMl: 2000, reminders: [] };
    expect(await codeOf(saveSettings(db, { ...base, language: "de" as never }))).toBe("invalid_value");
    expect(await codeOf(saveSettings(db, { ...base, waterGoalMl: -1 }))).toBe("invalid_ml");
    expect(
      await codeOf(
        saveSettings(db, {
          ...base,
          reminders: [{ id: "r", kind: "meal", mealSlot: null, hour: 24, minute: 0, enabled: true }],
        }),
      ),
    ).toBe("invalid_value");
  });
});
