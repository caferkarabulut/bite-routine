import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useI18n } from "../../i18n";
import type { Reminder } from "../../types";
import { Card, colors, Divider, TimeField, spacing, TOUCH, typography } from "../../ui";
import { cancelReminder, ensurePermission, mergeReminders, scheduleReminder } from "./reminders";

type Props = {
  reminders: readonly Reminder[];
  onChange: (reminders: Reminder[]) => Promise<void>;
};

export function RemindersSection({ reminders, onChange }: Props) {
  const { t, lang } = useI18n();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const list = mergeReminders(reminders);

  const nameOf = (r: Reminder) =>
    r.kind === "water"
      ? t("features.settings.reminderWaterName")
      : t("settings.reminderMeal", { meal: t(`meals.${r.mealSlot ?? "snack"}`) });

  async function apply(next: Reminder) {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const current = list.find((r) => r.id === next.id);
      if (next.enabled && !current?.enabled && !(await ensurePermission())) {
        setMessage(t("features.settings.permissionDenied"));
        return;
      }
      if (next.enabled) await scheduleReminder(next, lang);
      else await cancelReminder(next.id);
      await onChange(list.map((r) => (r.id === next.id ? next : r)));
    } catch {
      setMessage(t("features.settings.reminderFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <Text style={typography.muted}>{t("features.settings.remindersNote")}</Text>
      {list.map((r, i) => (
        <View key={r.id}>
          {i > 0 ? <Divider /> : null}
          <ReminderRow
            reminder={r}
            name={nameOf(r)}
            disabled={busy}
            onChange={(next) => void apply(next)}
          />
        </View>
      ))}
      {message ? (
        <Text accessibilityRole="alert" style={[typography.muted, { color: colors.danger }]}>
          {message}
        </Text>
      ) : null}
    </Card>
  );
}

function ReminderRow({
  reminder,
  name,
  disabled,
  onChange,
}: {
  reminder: Reminder;
  name: string;
  disabled: boolean;
  onChange: (next: Reminder) => void;
}) {
  const { t } = useI18n();
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="switch"
        accessibilityLabel={t("features.settings.reminderToggle", { name })}
        accessibilityState={{ checked: reminder.enabled, disabled }}
        disabled={disabled}
        onPress={() => onChange({ ...reminder, enabled: !reminder.enabled })}
        style={styles.toggle}
      >
        <Text style={[typography.body, { flex: 1 }]}>{name}</Text>
        <Text style={[typography.label, { color: reminder.enabled ? colors.primary : colors.textMuted }]}>
          {reminder.enabled ? t("features.settings.reminderEnabled") : t("features.settings.reminderDisabled")}
        </Text>
      </Pressable>
      <View style={styles.time} pointerEvents={disabled ? "none" : "auto"} accessibilityElementsHidden={disabled} importantForAccessibility={disabled ? "no-hide-descendants" : "auto"}>
        <Text style={typography.footnote}>{t("settings.reminderTime")}</Text>
        <TimeField
          testID={`reminder-time-${reminder.id}`}
          label={t("features.settings.reminderTimeLabel", { name })}
          value={{ hour: reminder.hour, minute: reminder.minute }}
          onChange={({ hour, minute }) => { if (!disabled) onChange({ ...reminder, hour, minute }); }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.xs, paddingVertical: spacing.xs },
  toggle: { minHeight: TOUCH, flexDirection: "row", alignItems: "center", gap: spacing.md },
  time: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
});
