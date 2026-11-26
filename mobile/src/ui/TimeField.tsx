// Hour:minute picker. iOS: compact native picker inline in the row. Android: a button that opens the dialog.
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { useOptionalI18n } from "../i18n";
import { colors, fonts, radius, spacing, typography, TOUCH } from "./theme";

export type TimeValue = { hour: number; minute: number };

/** "07:05". */
export function formatTime({ hour, minute }: TimeValue): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** A local Date today at the given time (the pickers work on Date). */
export function timeToDate({ hour, minute }: TimeValue, base: Date = new Date()): Date {
  const d = new Date(base);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export function dateToTime(date: Date): TimeValue {
  return { hour: date.getHours(), minute: date.getMinutes() };
}

export function TimeField({
  value,
  onChange,
  label,
  testID,
}: {
  value: TimeValue;
  onChange: (value: TimeValue) => void;
  /** Accessibility label; defaults to "Time". */
  label?: string;
  testID?: string;
}) {
  const i18n = useOptionalI18n();
  const a11yLabel = label ?? i18n?.t("ui.time") ?? "Time";
  const locale = i18n?.lang === "en" ? "en-GB" : "tr-TR";

  if (Platform.OS === "ios") {
    return (
      <View style={styles.iosWrap}>
        <DateTimePicker
          testID={testID}
          accessibilityLabel={a11yLabel}
          value={timeToDate(value)}
          mode="time"
          display="compact"
          locale={locale}
          accentColor={colors.primary}
          themeVariant="light"
          onValueChange={(_, date) => onChange(dateToTime(date))}
        />
      </View>
    );
  }

  const open = () =>
    DateTimePickerAndroid.open({
      value: timeToDate(value),
      mode: "time",
      is24Hour: true,
      onValueChange: (_, date) => onChange(dateToTime(date)),
    });

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${a11yLabel}, ${formatTime(value)}`}
      onPress={open}
      style={({ pressed }) => [styles.button, pressed ? { backgroundColor: colors.primarySoft } : null]}
    >
      <Text style={[styles.buttonText, typography.number]}>{formatTime(value)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iosWrap: { minHeight: TOUCH, justifyContent: "center" },
  button: {
    minHeight: TOUCH,
    minWidth: 72,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.searchBg,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
});
