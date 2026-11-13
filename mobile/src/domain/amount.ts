export const MAX_AMOUNT = 10_000;

const AMOUNT_RE = /^(?:\d+(?:[.,]\d+)?|[.,]\d+)$/;

/**
 * Parses a user-typed quantity ("1,5", "1.5", " 150 ").
 * Returns null for anything else: letters, several separators, <= 0, > 10000.
 */
export function parseAmount(text: string): number | null {
  if (typeof text !== "string") return null;
  const trimmed = text.trim();
  if (!AMOUNT_RE.test(trimmed)) return null;
  const value = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(value) || value <= 0 || value > MAX_AMOUNT) return null;
  return value;
}
