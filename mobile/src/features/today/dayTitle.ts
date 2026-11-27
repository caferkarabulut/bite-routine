// Title of the Today screen: "Bugün" / "Dün" / "Yarın", otherwise the weekday name.
import { addDays } from "../../domain";
import type { LocalDate } from "../../types";

export type DayTitleKind = "today" | "yesterday" | "tomorrow" | "weekday";

/** How many days past today the diary can be browsed (same rule as DayNavigator). */
export const FORWARD_DAYS = 7;

export function dayTitleKind(date: LocalDate, today: LocalDate): DayTitleKind {
  if (date === today) return "today";
  if (date === addDays(today, -1)) return "yesterday";
  if (date === addDays(today, 1)) return "tomorrow";
  return "weekday";
}

export function canGoForward(date: LocalDate, today: LocalDate): boolean {
  return date < addDays(today, FORWARD_DAYS);
}
