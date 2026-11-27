// Step logic of the amount stepper on the food detail screen (pure, no UI).
import { MAX_AMOUNT } from "../../domain/amount";
import { formatStepperValue, stepValue } from "../../ui/controls";

/** Grams: ±10, at least 1. Portions: ±0.5, at least 0.5. */
const GRAMS = { min: 1, step: 10 } as const;
const PORTION = { min: 0.5, step: 0.5 } as const;

export type AmountStepRange = { min: number; max: number; step: number };

/**
 * Range for the stepper. `portionGrams` is the weight of one unit of the chosen portion (null for plain grams);
 * the maximum keeps the total at or below 10 000 g, the limit `resolveAmount` accepts.
 */
export function amountStepRange(portionGrams: number | null): AmountStepRange {
  if (portionGrams === null) return { ...GRAMS, max: MAX_AMOUNT };
  const max = Math.floor((MAX_AMOUNT / portionGrams) / PORTION.step) * PORTION.step;
  return { ...PORTION, max: Math.max(PORTION.min, max) };
}

/** Text after one − (direction -1) or + (1) press, with the language's decimal separator. */
export function stepAmountText(text: string, direction: 1 | -1, portionGrams: number | null, lang: "tr" | "en"): string {
  return formatStepperValue(stepValue(text, direction, amountStepRange(portionGrams)), lang);
}
