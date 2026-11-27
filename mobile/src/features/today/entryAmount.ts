// Amount line of a diary entry on the Today screen: "1,5 kepçe · 225 g" for a portion, "40 g" for grams.
import { formatNumber } from "../../i18n";
import type { DiaryEntry, Language } from "../../types";
import { portionAmountText } from "../../ui/inputs";

/** Grams without a trailing ",0": 225 -> "225 g", 22.5 -> "22,5 g". */
function gramsText(grams: number, lang: Language): string {
  const rounded = Math.round(grams * 10) / 10;
  return `${formatNumber(rounded, lang, Number.isInteger(rounded) ? 0 : 1)} g`;
}

/**
 * Portion entries read "<amount> · <grams> g". Portion names carry their own count ("1 kepçe"), so 1,5 of it is
 * "1,5 kepçe" (see `portionAmountText`), not "1,5 1 kepçe". Entries without a portion show only the grams.
 */
export function entryAmountText(entry: Pick<DiaryEntry, "grams" | "portion">, lang: Language): string {
  const grams = gramsText(entry.grams, lang);
  if (!entry.portion) return grams;
  return `${portionAmountText(entry.portion.quantity, entry.portion.name, lang)} · ${grams}`;
}
