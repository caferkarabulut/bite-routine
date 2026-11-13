import type { Language, Reminder, Settings } from "../../types";
import type { Db } from "../types";
import {
  LANGUAGES,
  assertMl,
  assertValue,
  isBoolean,
  isMealSlot,
  isNonEmptyString,
  isObject,
  isOneOf,
} from "../validation";

type SettingsRow = { language: string | null; water_goal_ml: number; reminders: string };

export const DEFAULT_SETTINGS: Settings = { language: null, waterGoalMl: 2000, reminders: [] };

export function isReminder(v: unknown): v is Reminder {
  return (
    isObject(v) &&
    isNonEmptyString(v.id) &&
    (v.kind === "meal" || v.kind === "water") &&
    (v.mealSlot === null || isMealSlot(v.mealSlot)) &&
    Number.isInteger(v.hour) &&
    (v.hour as number) >= 0 &&
    (v.hour as number) <= 23 &&
    Number.isInteger(v.minute) &&
    (v.minute as number) >= 0 &&
    (v.minute as number) <= 59 &&
    isBoolean(v.enabled)
  );
}

function parseReminders(json: string): Reminder[] {
  try {
    const parsed: unknown = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter(isReminder) : [];
  } catch {
    return [];
  }
}

/** Defaults when nothing has been saved yet. */
export async function getSettings(db: Db): Promise<Settings> {
  const row = await db.getFirstAsync<SettingsRow>("SELECT * FROM settings WHERE id = 1", []);
  if (!row) return { ...DEFAULT_SETTINGS, reminders: [] };
  return {
    language: row.language as Language | null,
    waterGoalMl: row.water_goal_ml,
    reminders: parseReminders(row.reminders),
  };
}

export function assertSettings(s: Settings): void {
  assertValue(s.language === null || isOneOf(LANGUAGES, s.language), "language must be null, tr or en");
  assertMl(s.waterGoalMl, "waterGoalMl");
  assertValue(Array.isArray(s.reminders) && s.reminders.every(isReminder), "invalid reminders");
}

export async function saveSettings(db: Db, settings: Settings): Promise<Settings> {
  assertSettings(settings);
  await db.runAsync(
    `INSERT INTO settings (id, language, water_goal_ml, reminders) VALUES (1, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET language = excluded.language,
       water_goal_ml = excluded.water_goal_ml, reminders = excluded.reminders`,
    [settings.language, settings.waterGoalMl, JSON.stringify(settings.reminders)],
  );
  return getSettings(db);
}
