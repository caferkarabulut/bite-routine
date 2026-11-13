import type { ReactElement } from "react";

import { I18nProvider } from "../../src/i18n";

/** Wraps a screen in the Turkish I18nProvider. Pair with jest.mock of AppState and expo-router. */
export function withI18n(ui: ReactElement, language: "tr" | "en" = "tr"): ReactElement {
  return <I18nProvider language={language}>{ui}</I18nProvider>;
}
