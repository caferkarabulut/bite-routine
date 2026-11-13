// Shared diary inputs used by several screens. Owned by the coordinator.
import { Pressable, StyleSheet, Text, View } from "react-native";

import { addDays, gramsForPortion, parseAmount, todayInIstanbul } from "../domain";
import { formatDate, formatGrams, useI18n } from "../i18n";
import { MEAL_SLOTS, type LocalDate, type MealSlot, type Portion, type PortionSnapshot } from "../types";
import { ChoiceChips, TextField } from "./components";
import { colors, spacing, typography, TOUCH } from "./theme";

/** What the user typed: grams directly, or a quantity of one portion. */
export type AmountValue = { unit: "grams" | string; text: string };

export type ResolvedAmount = { grams: number; portion: PortionSnapshot | null };

export function portionName(portion: Portion, lang: "tr" | "en"): string {
  return lang === "en" && portion.nameEn ? portion.nameEn : portion.nameTr;
}

/** Converts the input into grams (+ portion snapshot), or null when invalid. */
export function resolveAmount(value: AmountValue, portions: readonly Portion[], lang: "tr" | "en"): ResolvedAmount | null {
  const n = parseAmount(value.text);
  if (n === null) return null;
  if (value.unit === "grams") return { grams: n, portion: null };
  const portion = portions.find((p) => p.id === value.unit);
  if (!portion) return null;
  const grams = gramsForPortion(portion.grams, n);
  if (!(grams > 0) || grams > 10000) return null;
  return {
    grams,
    portion: { id: portion.id, name: portionName(portion, lang), gramsPerUnit: portion.grams, quantity: n },
  };
}

/** Default input for a food: its first portion × 1, or 100 g when it has none. */
export function defaultAmount(portions: readonly Portion[]): AmountValue {
  return portions.length > 0 ? { unit: portions[0].id, text: "1" } : { unit: "grams", text: "100" };
}

export function AmountInput({
  portions,
  value,
  onChange,
  showError = false,
}: {
  portions: readonly Portion[];
  value: AmountValue;
  onChange: (value: AmountValue) => void;
  showError?: boolean;
}) {
  const { t, lang } = useI18n();
  const resolved = resolveAmount(value, portions, lang);
  const options = [
    { value: "grams", label: t("catalog.grams") },
    ...portions.map((p) => ({ value: p.id, label: `${portionName(p, lang)} (${formatGrams(p.grams, lang)} g)` })),
  ];
  return (
    <View style={{ gap: spacing.md }}>
      {portions.length > 0 ? (
        <ChoiceChips
          label={t("catalog.portion")}
          options={options}
          value={value.unit}
          onChange={(unit) => onChange({ unit, text: unit === "grams" ? "100" : "1" })}
        />
      ) : null}
      <TextField
        label={value.unit === "grams" ? t("catalog.grams") : t("catalog.quantity")}
        value={value.text}
        onChangeText={(text) => onChange({ ...value, text })}
        keyboardType="decimal-pad"
        inputMode="decimal"
        suffix={value.unit === "grams" ? "g" : undefined}
        error={showError && !resolved ? t("catalog.invalidAmount") : null}
        hint={resolved && value.unit !== "grams" ? `≈ ${formatGrams(resolved.grams, lang)} g` : undefined}
      />
    </View>
  );
}

export function MealSlotPicker({ value, onChange }: { value: MealSlot; onChange: (slot: MealSlot) => void }) {
  const { t } = useI18n();
  return (
    <ChoiceChips
      label={t("catalog.chooseMeal")}
      options={MEAL_SLOTS.map((slot) => ({ value: slot, label: t(`meals.${slot}`) }))}
      value={value}
      onChange={onChange}
    />
  );
}

/** Suggested meal for "now" in Istanbul time. */
export function mealSlotForTime(now: Date = new Date()): MealSlot {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Istanbul", hour: "2-digit", hourCycle: "h23" }).format(now),
  );
  if (hour < 11) return "breakfast";
  if (hour < 16) return "lunch";
  if (hour < 21) return "dinner";
  return "snack";
}

/** Previous / current day / next row. The future is allowed up to 7 days ahead. */
export function DayNavigator({ date, onChange }: { date: LocalDate; onChange: (date: LocalDate) => void }) {
  const { t, lang } = useI18n();
  const today = todayInIstanbul();
  const canGoForward = date < addDays(today, 7);
  return (
    <View style={styles.dayRow}>
      <ArrowButton label={t("today.previousDay")} symbol="‹" onPress={() => onChange(addDays(date, -1))} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={date === today ? t("common.today") : t("today.goToToday")}
        disabled={date === today}
        onPress={() => onChange(today)}
        style={styles.dayLabel}
      >
        <Text style={typography.label}>{date === today ? t("common.today") : formatDate(date, lang)}</Text>
        {date !== today ? <Text style={typography.small}>{t("today.goToToday")}</Text> : null}
      </Pressable>
      <ArrowButton
        label={t("today.nextDay")}
        symbol="›"
        disabled={!canGoForward}
        onPress={() => onChange(addDays(date, 1))}
      />
    </View>
  );
}

function ArrowButton({ label, symbol, onPress, disabled }: { label: string; symbol: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.arrow, disabled ? { opacity: 0.3 } : null]}
    >
      <Text style={styles.arrowText}>{symbol}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dayRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  dayLabel: { flex: 1, alignItems: "center", minHeight: TOUCH, justifyContent: "center" },
  arrow: { width: TOUCH, height: TOUCH, alignItems: "center", justifyContent: "center" },
  arrowText: { fontSize: 28, color: colors.primary },
});
