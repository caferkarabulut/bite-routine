import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useI18n } from "../../i18n";
import type { Reminder } from "../../types";
import { Card, colors, Divider, radius, spacing, TOUCH, typography } from "../../ui";
import { cancelReminder, ensurePermission, formatTime, mergeReminders, scheduleReminder, stepHour, stepMinute } from "./reminders";

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
      <Text style={typography.muted}>{t("settings.remindersHint")}</Text>
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
      <View style={styles.time} accessibilityLabel={`${t("settings.reminderTime")} ${formatTime(reminder.hour, reminder.minute)}`}>
        <Stepper
          upLabel={t("features.settings.hourUp")}
          downLabel={t("features.settings.hourDown")}
          text={String(reminder.hour).padStart(2, "0")}
          disabled={disabled}
          onUp={() => onChange({ ...reminder, hour: stepHour(reminder.hour, 1) })}
          onDown={() => onChange({ ...reminder, hour: stepHour(reminder.hour, -1) })}
        />
        <Text style={typography.heading}>:</Text>
        <Stepper
          upLabel={t("features.settings.minuteUp")}
          downLabel={t("features.settings.minuteDown")}
          text={String(reminder.minute).padStart(2, "0")}
          disabled={disabled}
          onUp={() => onChange({ ...reminder, minute: stepMinute(reminder.minute, 5) })}
          onDown={() => onChange({ ...reminder, minute: stepMinute(reminder.minute, -5) })}
        />
      </View>
    </View>
  );
}

function Stepper({
  upLabel,
  downLabel,
  text,
  disabled,
  onUp,
  onDown,
}: {
  upLabel: string;
  downLabel: string;
  text: string;
  disabled: boolean;
  onUp: () => void;
  onDown: () => void;
}) {
  return (
    <View style={styles.stepper}>
      <StepButton label={downLabel} symbol="−" onPress={onDown} disabled={disabled} />
      <Text style={[typography.heading, { minWidth: 32, textAlign: "center" }]}>{text}</Text>
      <StepButton label={upLabel} symbol="+" onPress={onUp} disabled={disabled} />
    </View>
  );
}

function StepButton({ label, symbol, onPress, disabled }: { label: string; symbol: string; onPress: () => void; disabled: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={styles.stepButton}
    >
      <Text style={styles.stepSymbol}>{symbol}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.xs, paddingVertical: spacing.xs },
  toggle: { minHeight: TOUCH, flexDirection: "row", alignItems: "center", gap: spacing.md },
  time: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  stepper: { flexDirection: "row", alignItems: "center" },
  stepButton: {
    width: TOUCH,
    height: TOUCH,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
  stepSymbol: { fontSize: 24, color: colors.primary },
});
