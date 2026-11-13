import { dateParts } from "../domain/dates";
import type { Language, LocalDate } from "../types";

const TR_MONTHS = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
] as const;
const TR_WEEKDAYS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"] as const;
const EN_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;
const EN_WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

/** Shown in place of a missing (null) value; never "0". */
export const MISSING = "—";

/** Fixed-decimal number: tr "1.234,5", en "1,234.5". */
export function formatNumber(n: number, lang: Language, digits = 0): string {
  if (!Number.isFinite(n)) return MISSING;
  const fixed = Math.abs(n).toFixed(digits);
  const [intPart = "0", frac] = fixed.split(".");
  const groupSep = lang === "tr" ? "." : ",";
  const decimalSep = lang === "tr" ? "," : ".";
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, groupSep);
  const body = frac === undefined ? grouped : `${grouped}${decimalSep}${frac}`;
  const isZero = Number(fixed) === 0;
  return n < 0 && !isZero ? `-${body}` : body;
}

/** "1.234 kcal"; null gives the missing marker. */
export function formatKcal(n: number | null, lang: Language): string {
  return n === null ? MISSING : `${formatNumber(n, lang, 0)} kcal`;
}

/** "12,5 g" (one decimal only when needed); null gives the missing marker. */
export function formatGrams(n: number | null, lang: Language): string {
  if (n === null) return MISSING;
  const rounded = Math.round(n * 10) / 10;
  return `${formatNumber(rounded, lang, Number.isInteger(rounded) ? 0 : 1)} g`;
}

/** tr: "13 Kasım Perşembe"; en: "Thursday, November 13". */
export function formatDate(date: LocalDate, lang: Language): string {
  const { month, day, weekday } = dateParts(date);
  if (lang === "tr") return `${day} ${TR_MONTHS[month - 1]} ${TR_WEEKDAYS[weekday]}`;
  return `${EN_WEEKDAYS[weekday]}, ${EN_MONTHS[month - 1]} ${day}`;
}

/** Short weekday name for chart labels: "Per" / "Thu". */
export function formatWeekdayShort(date: LocalDate, lang: Language): string {
  const { weekday } = dateParts(date);
  const name = lang === "tr" ? TR_WEEKDAYS[weekday] : EN_WEEKDAYS[weekday];
  return name.slice(0, 3);
}
