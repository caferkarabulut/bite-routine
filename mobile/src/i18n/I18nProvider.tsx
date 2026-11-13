import { useLocales } from "expo-localization";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import type { Language } from "../types";
import { createTranslator, languageFromLocaleCode, type TFunction } from "./translate";

export type I18nValue = {
  lang: Language;
  t: TFunction;
  /** Switches the language now; null returns to the device language. */
  setLanguage: (language: Language | null) => void;
};

const I18nContext = createContext<I18nValue | null>(null);

type Props = {
  /** Settings.language: null follows the device language. */
  language: Language | null;
  /** Called when the user changes the language so the caller can persist it. */
  onLanguageChange?: (language: Language | null) => void;
  children: ReactNode;
};

export function I18nProvider({ language, onLanguageChange, children }: Props) {
  const locales = useLocales();
  const [override, setOverride] = useState<{ base: Language | null; value: Language | null } | null>(null);

  // A local choice applies until the persisted setting changes again.
  const chosen = override !== null && override.base === language ? override.value : language;
  const lang = chosen ?? languageFromLocaleCode(locales[0]?.languageCode);

  const setLanguage = useCallback(
    (next: Language | null) => {
      setOverride({ base: language, value: next });
      onLanguageChange?.(next);
    },
    [language, onLanguageChange],
  );

  const value = useMemo<I18nValue>(() => ({ lang, t: createTranslator(lang), setLanguage }), [lang, setLanguage]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside <I18nProvider>.");
  return value;
}
