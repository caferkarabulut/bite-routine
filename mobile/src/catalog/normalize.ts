// Turkish-aware text normalization. Pure TypeScript; does not rely on ICU locale support
// (Hermes may ignore the "tr" locale), so the dotted/dotless I rules are applied by hand.

const FOLD_MAP: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ş: "s",
  ü: "u",
  â: "a",
  î: "i",
  û: "u",
  ê: "e",
  ô: "o",
};

/** Turkish lower-casing: İ→i, I→ı. */
export function lowerTr(text: string): string {
  return text.replace(/İ/g, "i").replace(/I/g, "ı").toLowerCase().replace(/̇/g, "");
}

/**
 * Lower-case with Turkish rules, drop apostrophes, turn other punctuation into spaces,
 * collapse whitespace. Keeps Turkish letters (ç ğ ı ö ş ü).
 */
export function normalizeTr(text: string): string {
  return lowerTr(text.normalize("NFC"))
    .replace(/['’‘`]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Accent-insensitive form used for matching: normalizeTr, then ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u... */
export function foldTr(text: string): string {
  return normalizeTr(text).replace(/[çğıöşüâîûêô]/g, (c) => FOLD_MAP[c] ?? c);
}
