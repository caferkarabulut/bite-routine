import { render } from "@testing-library/react-native";
import type { ReactElement } from "react";

import { DatabaseProvider, migrate, type Db } from "../../src/db";
import { I18nProvider } from "../../src/i18n";
import { AppStateProvider } from "../../src/state/AppState";
import type { Language, NewDiaryEntry, Nutrients } from "../../src/types";
import { createNodeDb } from "./db-node-sqlite";

export const TODAY = "2026-11-13";

/** Freezes only Date so `todayInIstanbul()` is stable; timers stay real. */
export function freezeDate(iso = "2026-11-13T09:00:00Z"): void {
  jest.useFakeTimers({
    now: new Date(iso),
    doNotFake: [
      "setTimeout",
      "clearTimeout",
      "setInterval",
      "clearInterval",
      "setImmediate",
      "clearImmediate",
      "nextTick",
      "queueMicrotask",
      "requestAnimationFrame",
      "cancelAnimationFrame",
      "requestIdleCallback",
      "cancelIdleCallback",
      "performance",
      "hrtime",
    ],
  });
}

export async function freshDb(): Promise<Db> {
  const db = createNodeDb();
  await migrate(db);
  return db;
}

export async function renderWithApp(ui: ReactElement, db: Db, language: Language = "tr") {
  return await render(
    <DatabaseProvider open={async () => db}>
      <AppStateProvider>
        <I18nProvider language={language}>{ui}</I18nProvider>
      </AppStateProvider>
    </DatabaseProvider>,
  );
}

export function entryInput(date: string, per100g: Nutrients, grams = 100, name = "Test yemek"): NewDiaryEntry {
  return {
    date,
    mealSlot: "lunch",
    food: { kind: "food", id: "food-1" },
    foodName: name,
    grams,
    portion: null,
    per100g,
  };
}
