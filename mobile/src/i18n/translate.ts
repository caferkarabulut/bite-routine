import { en } from "./en";
import { tr, type Dictionary } from "./tr";
import type { Language } from "../types";

type Paths<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Paths<T[K], `${P}${K}.`>;
}[keyof T & string];

/** Dotted key of any string in the Turkish source dictionary, e.g. "tabs.today". */
export type TranslationKey = Paths<Dictionary>;

export type TranslateParams = Record<string, string | number>;
export type TFunction = (key: TranslationKey, params?: TranslateParams) => string;

const dictionaries: Record<Language, unknown> = { tr, en };

function lookup(dict: unknown, key: string): string | undefined {
  let node: unknown = dict;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : undefined;
}

/** Replaces `{name}` placeholders; unknown placeholders stay as written. */
export function interpolate(template: string, params?: TranslateParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match,
  );
}

/** Translator for a fixed language; falls back to Turkish, then to the key itself. */
export function createTranslator(lang: Language): TFunction {
  return (key, params) => {
    const text = lookup(dictionaries[lang], key) ?? lookup(tr, key) ?? key;
    return interpolate(text, params);
  };
}

/** Turkish unless the device language code is English ("en", "en-US", ...). */
export function languageFromLocaleCode(code: string | null | undefined): Language {
  return typeof code === "string" && /^en(?:[-_]|$)/i.test(code) ? "en" : "tr";
}
