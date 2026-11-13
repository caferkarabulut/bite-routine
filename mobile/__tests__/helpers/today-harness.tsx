import { render } from "@testing-library/react-native";
import type { ReactElement } from "react";

import { AppStateProvider } from "../../src/state/AppState";
import { DatabaseProvider, addEntry, migrate, saveProfile } from "../../src/db";
import type { Db } from "../../src/db";
import { I18nProvider } from "../../src/i18n";
import type { Language, NewDiaryEntry } from "../../src/types";
import { createNodeDb } from "./db-node-sqlite";

export async function makeDb(): Promise<Db> {
  const db = createNodeDb();
  await migrate(db);
  return db;
}

/** Profile with explicit kcal/protein overrides so targets are predictable (kcal 2000, protein 100). */
export async function seedProfile(db: Db, kcalOverride: number | null = 2000): Promise<void> {
  await saveProfile(db, {
    birthYear: 1990,
    sex: "female",
    heightCm: 165,
    weightKg: 60,
    activity: "light",
    goal: "maintain",
    kcalOverride,
    proteinOverride: 100,
  });
}

export function entryInput(date: string, overrides: Partial<NewDiaryEntry> = {}): NewDiaryEntry {
  return {
    date,
    mealSlot: "breakfast",
    food: { kind: "food", id: "usda-171287" },
    foodName: "Yumurta (çiğ)",
    grams: 100,
    portion: null,
    per100g: { kcal: 100, protein: 10, carbs: 5, fat: 2 },
    ...overrides,
  };
}

export async function seedEntry(db: Db, date: string, overrides: Partial<NewDiaryEntry> = {}) {
  return addEntry(db, entryInput(date, overrides));
}

export async function renderWithApp(ui: ReactElement, db: Db, language: Language = "tr") {
  return await render(
    <I18nProvider language={language}>
      <DatabaseProvider open={async () => db}>
        <AppStateProvider>{ui}</AppStateProvider>
      </DatabaseProvider>
    </I18nProvider>,
  );
}
