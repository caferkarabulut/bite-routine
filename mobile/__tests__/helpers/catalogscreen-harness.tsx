import { render } from "@testing-library/react-native";
import type { ReactElement } from "react";

import { DatabaseProvider, migrate, type Db } from "../../src/db";
import { I18nProvider } from "../../src/i18n";
import { AppStateProvider } from "../../src/state/AppState";
import type { Language } from "../../src/types";
import { createNodeDb } from "./db-node-sqlite";

export async function createDb(): Promise<Db> {
  const db = createNodeDb();
  await migrate(db);
  return db;
}

/** Renders a screen with a real in-memory database, app state and i18n. */
export async function renderWithApp(ui: ReactElement, db: Db, language: Language = "tr") {
  return await render(
    <I18nProvider language={language}>
      <DatabaseProvider open={async () => db}>
        <AppStateProvider>{ui}</AppStateProvider>
      </DatabaseProvider>
    </I18nProvider>,
  );
}
