// Local daily reminders (expo-notifications). Reminder ids double as notification identifiers.
import * as Notifications from "expo-notifications";
import { AndroidImportance } from "expo-notifications";
import { Platform } from "react-native";

import { createTranslator } from "../../i18n";
import type { Language, MealSlot, Reminder } from "../../types";

export const REMINDER_CHANNEL_ID = "reminders";

const MEAL_DEFAULTS: { slot: MealSlot; hour: number; minute: number }[] = [
  { slot: "breakfast", hour: 8, minute: 30 },
  { slot: "lunch", hour: 12, minute: 30 },
  { slot: "dinner", hour: 19, minute: 0 },
];

/** Suggested reminders, all disabled until the user turns them on. */
export const DEFAULT_REMINDERS: readonly Reminder[] = [
  ...MEAL_DEFAULTS.map<Reminder>((m) => ({
    id: `meal-${m.slot}`,
    kind: "meal",
    mealSlot: m.slot,
    hour: m.hour,
    minute: m.minute,
    enabled: false,
  })),
  { id: "water-daily", kind: "water", mealSlot: null, hour: 15, minute: 0, enabled: false },
];

/** Saved reminders win over defaults of the same id; defaults fill the gaps. */
export function mergeReminders(saved: readonly Reminder[]): Reminder[] {
  const known = new Set(DEFAULT_REMINDERS.map((r) => r.id));
  const byId = new Map(saved.map((r) => [r.id, r]));
  return [...DEFAULT_REMINDERS.map((d) => byId.get(d.id) ?? { ...d }), ...saved.filter((r) => !known.has(r.id))];
}

export function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function stepHour(hour: number, delta: number): number {
  return (((hour + delta) % 24) + 24) % 24;
}

export function stepMinute(minute: number, delta: number): number {
  return (((minute + delta) % 60) + 60) % 60;
}

async function ensureChannel(language: Language): Promise<void> {
  if (Platform.OS !== "android") return;
  const t = createTranslator(language);
  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: t("features.settings.channelName"),
    importance: AndroidImportance.DEFAULT,
  });
}

/** Asks for notification permission if needed. Resolves true only when granted. */
export async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function cancelReminder(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}

/** Replaces the daily notification of this reminder; a disabled reminder is only cancelled. */
export async function scheduleReminder(reminder: Reminder, language: Language): Promise<void> {
  await cancelReminder(reminder.id);
  if (!reminder.enabled) return;
  const t = createTranslator(language);
  await ensureChannel(language);
  const body =
    reminder.kind === "water"
      ? t("features.settings.notifWaterBody")
      : t("features.settings.notifMealBody", { meal: t(`meals.${reminder.mealSlot ?? "snack"}`) });
  await Notifications.scheduleNotificationAsync({
    identifier: reminder.id,
    content: { title: t("app.name"), body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: reminder.hour,
      minute: reminder.minute,
      channelId: REMINDER_CHANNEL_ID,
    },
  });
}

/**
 * Makes the scheduled notifications match `reminders`. Call from the root layout once settings
 * are loaded: `void syncReminders(settings.reminders, lang)`. Schedules nothing without
 * permission and never prompts. Also lets notifications show while the app is open.
 */
export async function syncReminders(reminders: readonly Reminder[], language: Language): Promise<void> {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  const permission = await Notifications.getPermissionsAsync();
  for (const r of mergeReminders(reminders)) {
    if (r.enabled && permission.granted) await scheduleReminder(r, language);
    else await cancelReminder(r.id);
  }
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
