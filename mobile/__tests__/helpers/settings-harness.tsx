// Test harness for the settings screens: real providers over the Node SQLite adapter.
import { render } from "@testing-library/react-native";
import type { ReactElement, ReactNode } from "react";

import { DatabaseProvider, migrate, saveProfile, type Db } from "../../src/db";
import { I18nProvider } from "../../src/i18n";
import { AppStateProvider, useAppState } from "../../src/state/AppState";
import { createNodeDb } from "./db-node-sqlite";

export async function freshDb(): Promise<Db> {
  const db = createNodeDb();
  await migrate(db);
  return db;
}

export async function seedProfile(db: Db): Promise<void> {
  await saveProfile(db, {
    birthYear: 1990,
    sex: "female",
    heightCm: 165,
    weightKg: 62,
    activity: "light",
    goal: "maintain",
    kcalOverride: null,
    proteinOverride: null,
  });
}

/** Mirrors the root layout: language comes from, and is saved to, the settings. */
function SettingsLanguage({ children }: { children: ReactNode }) {
  const { settings, saveSettings } = useAppState();
  return (
    <I18nProvider language={settings.language} onLanguageChange={(language) => void saveSettings({ ...settings, language })}>
      {children}
    </I18nProvider>
  );
}

export async function renderWithApp(db: Db, ui: ReactElement) {
  return await render(
    <I18nProvider language="tr">
      <DatabaseProvider open={async () => db}>
        <AppStateProvider>
          <SettingsLanguage>{ui}</SettingsLanguage>
        </AppStateProvider>
      </DatabaseProvider>
    </I18nProvider>,
  );
}
