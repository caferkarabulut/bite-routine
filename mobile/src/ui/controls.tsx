// Design-pass controls (Faz 3). Owned by the coordinator; feature agents use but do not edit these.
import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Switch, Text, TextInput, View, type StyleProp, type ViewStyle } from "react-native";

import { parseAmount } from "../domain/amount";
import { formatNumber, useOptionalI18n } from "../i18n";
import { tapLight, selection } from "./haptics";
import { Icon, type IconName } from "./Icon";
import { colors, fonts, palette, radius, shadow, spacing, typography, TOUCH } from "./theme";

// ---------------------------------------------------------------------------------------------------------
// IconButton

type IconButtonVariant = "plain" | "tinted" | "filled";

/**
 * Icon-only button with a touch area of at least TOUCH. `plain`: icon only; `tinted`: soft circle;
 * `filled`: small primary circle (the "+" next to a meal).
 */
export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  variant = "plain",
  color,
  size = 22,
  filled = false,
  disabled = false,
  accessibilityHint,
  selected,
  testID,
  style,
}: {
  icon: IconName;
  accessibilityLabel: string;
  onPress: () => void;
  variant?: IconButtonVariant;
  color?: string;
  /** Glyph size. */
  size?: number;
  /** Filled glyph variant. */
  filled?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
  /** Toggle state (e.g. favorite), announced as selected. */
  selected?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const tint = disabled ? colors.disabled : (color ?? (variant === "filled" ? colors.onPrimary : colors.primary));
  const glyph = <Icon name={icon} size={variant === "filled" ? Math.min(size, 18) : size} color={tint} filled={filled} />;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        variant === "tinted" ? { backgroundColor: colors.primarySoft, borderRadius: radius.pill } : null,
        pressed ? { opacity: 0.6 } : null,
        style,
      ]}
    >
      {variant === "filled" ? (
        <View style={[styles.iconButtonDisc, { backgroundColor: disabled ? colors.disabled : colors.primary }]}>{glyph}</View>
      ) : (
        glyph
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------------------------------------
// SectionHeader

/** Section title with an optional muted detail ("137 kcal") and an optional trailing action. */
export function SectionHeader({
  title,
  detail,
  action,
  style,
}: {
  title: string;
  detail?: string;
  /** Usually a filled "+" IconButton. */
  action?: { icon?: IconName; accessibilityLabel: string; onPress: () => void; testID?: string };
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.sectionHeader, style]}>
      <Text accessibilityRole="header" style={[typography.section, { flex: 1 }]} numberOfLines={2}>
        {title}
        {detail ? <Text style={[styles.sectionDetail, typography.number]}>{`  ${detail}`}</Text> : null}
      </Text>
      {action ? (
        <IconButton
          icon={action.icon ?? "plus"}
          variant="filled"
          accessibilityLabel={action.accessibilityLabel}
          onPress={action.onPress}
          testID={action.testID}
        />
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------------------------------------
// SearchBar

export function SearchBar({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
  onCancel,
  onSubmit,
  autoFocus,
  testID,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  /** Defaults to the placeholder, then "Search". */
  accessibilityLabel?: string;
  /** When set, a "Cancel" text button appears while the field is focused or has text. */
  onCancel?: () => void;
  onSubmit?: () => void;
  autoFocus?: boolean;
  testID?: string;
}) {
  const i18n = useOptionalI18n();
  const t = (key: "ui.clearSearch" | "ui.cancelSearch" | "common.search", fallback: string) => i18n?.t(key) ?? fallback;
  const [focused, setFocused] = useState(false);
  const label = accessibilityLabel ?? placeholder ?? t("common.search", "Search");
  return (
    <View style={styles.searchRow} accessibilityRole="search">
      <View style={[styles.searchField, focused ? styles.searchFieldFocused : null]}>
        <Icon name="search" size={20} color={colors.textMuted} />
        <TextInput
          testID={testID}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={label}
          autoFocus={autoFocus}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          clearButtonMode="never"
          onSubmitEditing={onSubmit}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.searchInput}
        />
        {value.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("ui.clearSearch", "Clear search")}
            onPress={() => onChangeText("")}
            hitSlop={10}
            style={styles.searchClear}
          >
            <Icon name="clear" size={18} color={colors.outline} />
          </Pressable>
        ) : null}
      </View>
      {onCancel && (focused || value.length > 0) ? (
        <Pressable accessibilityRole="button" onPress={onCancel} style={styles.searchCancel}>
          <Text style={styles.searchCancelText}>{t("ui.cancelSearch", "Cancel")}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------------------------------------
// SegmentedControl

/** Single-choice segments drawn by us (no native dependency). Announced as a radio group. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  testID,
}: {
  options: readonly { value: T; label: string; testID?: string }[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
  testID?: string;
}) {
  return (
    <View testID={testID} style={styles.segmented} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            testID={o.testID}
            accessibilityRole="radio"
            accessibilityLabel={o.label}
            accessibilityState={{ checked: selected, selected }}
            onPress={() => {
              if (selected) return;
              selection();
              onChange(o.value);
            }}
            style={[styles.segment, selected ? styles.segmentSelected : null]}
          >
            <Text numberOfLines={1} style={[styles.segmentText, selected ? styles.segmentTextSelected : null]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------------------------------------
// Chip

/** A single pill. With `selected` it is a toggle; without, a plain button (e.g. a category). */
export function Chip({
  label,
  onPress,
  selected,
  icon,
  accessibilityRole = "button",
  testID,
}: {
  label: string;
  onPress: () => void;
  selected?: boolean;
  icon?: IconName;
  accessibilityRole?: "button" | "radio" | "checkbox";
  testID?: string;
}) {
  const on = !!selected;
  return (
    <Pressable
      testID={testID}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={label}
      accessibilityState={
        selected === undefined ? undefined : accessibilityRole === "button" ? { selected: on } : { checked: on, selected: on }
      }
      onPress={onPress}
      style={({ pressed }) => [styles.chip, on ? styles.chipOn : null, pressed && !on ? { backgroundColor: colors.primarySoft } : null]}
    >
      {icon ? <Icon name={icon} size={18} color={on ? colors.onPrimary : colors.primary} /> : null}
      <Text style={[styles.chipText, on ? styles.chipTextOn : null]}>{label}</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------------------------------------
// Stepper

function decimals(n: number): number {
  if (!Number.isFinite(n) || Number.isInteger(n)) return 0;
  const s = String(n);
  const dot = s.indexOf(".");
  return dot < 0 ? 0 : Math.min(3, s.length - dot - 1);
}

/** Parses stepper text: like `parseAmount` (comma or dot decimals, max 10000) but also allows 0. */
export function parseStepperText(text: string): number | null {
  if (/^\s*0+(?:[.,]0+)?\s*$/.test(text)) return 0;
  return parseAmount(text);
}

/** Stepper text for a number: no grouping (parseAmount rejects "1.000"), language decimal separator. */
export function formatStepperValue(n: number, lang: "tr" | "en"): string {
  const s = String(n);
  return lang === "tr" ? s.replace(".", ",") : s;
}

/**
 * Value after one − / + press. Invalid text starts from `min`. Rounded to the precision of the step or the
 * current value, then clamped to min..max.
 */
export function stepValue(text: string, direction: 1 | -1, { min, max, step }: { min: number; max: number; step: number }): number {
  const current = parseStepperText(text);
  if (current === null) return min;
  const digits = Math.max(decimals(step), decimals(current));
  const next = Number((current + direction * step).toFixed(digits));
  return Math.min(max, Math.max(min, next));
}

/**
 * − value + . The value stays text so the user can type freely ("1,", "1,5"); the parent validates with
 * `parseAmount` as before. Steps are written back with the language's decimal separator.
 */
export function Stepper({
  value,
  onChangeText,
  label,
  min = 0,
  max = 10_000,
  step = 1,
  testID,
  style,
}: {
  value: string;
  onChangeText: (text: string) => void;
  /** Accessibility label of the text field. */
  label: string;
  min?: number;
  max?: number;
  step?: number;
  /** testID of the text field. */
  testID?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const i18n = useOptionalI18n();
  const lang = i18n?.lang ?? "tr";
  const current = parseStepperText(value);
  const canDecrease = current === null || current > min;
  const canIncrease = current === null || current < max;
  const press = (direction: 1 | -1) => {
    const next = stepValue(value, direction, { min, max, step });
    tapLight();
    onChangeText(formatStepperValue(next, lang));
  };
  return (
    <View style={[styles.stepper, style]}>
      <IconButton
        icon="minus"
        accessibilityLabel={i18n?.t("ui.decrease") ?? "Decrease"}
        onPress={() => press(-1)}
        disabled={!canDecrease}
        testID={testID ? `${testID}-decrease` : undefined}
      />
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        accessibilityLabel={label}
        keyboardType="decimal-pad"
        inputMode="decimal"
        selectTextOnFocus
        style={[styles.stepperInput, typography.number]}
      />
      <IconButton
        icon="plus"
        accessibilityLabel={i18n?.t("ui.increase") ?? "Increase"}
        onPress={() => press(1)}
        disabled={!canIncrease}
        testID={testID ? `${testID}-increase` : undefined}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------------------------------------
// MacroBar

/** Label, "value / target unit" and a thin bar. The bar is decorative; the numbers carry the meaning. */
export function MacroBar({
  label,
  value,
  target,
  unit = "g",
  color = colors.primary,
}: {
  label: string;
  value: number;
  target: number | null;
  unit?: string;
  color?: string;
}) {
  const i18n = useOptionalI18n();
  const lang = i18n?.lang ?? "tr";
  const ratio = target && target > 0 ? Math.max(0, Math.min(1, value / target)) : 0;
  const valueText = formatNumber(Math.round(value), lang);
  const targetText = target ? ` / ${formatNumber(Math.round(target), lang)} ${unit}` : ` ${unit}`;
  return (
    <View
      style={styles.macro}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ text: `${valueText}${targetText}` }}
    >
      <Text style={typography.footnote} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.macroValue, typography.number]} numberOfLines={1}>
        {valueText}
        <Text style={styles.macroTarget}>{targetText}</Text>
      </Text>
      <View style={styles.macroTrack}>
        <View style={[styles.macroFill, { width: `${ratio * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------------------------------------
// SettingsRow

/** Settings line: title (+ subtitle) and on the right a Switch, or a value with a chevron when tappable. */
export function SettingsRow({
  title,
  subtitle,
  value,
  onPress,
  switchValue,
  onSwitchChange,
  icon,
  testID,
  children,
}: {
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  icon?: IconName;
  testID?: string;
  /** Custom trailing content (e.g. a TimeField). */
  children?: ReactNode;
}) {
  const hasSwitch = switchValue !== undefined && !!onSwitchChange;
  const text = (
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={typography.body}>{title}</Text>
      {subtitle ? <Text style={typography.footnote}>{subtitle}</Text> : null}
    </View>
  );
  const lead = icon ? <Icon name={icon} size={22} color={colors.primary} /> : null;
  if (hasSwitch) {
    return (
      <View style={styles.settingsRow}>
        {lead}
        {text}
        <Switch
          testID={testID}
          accessibilityLabel={title}
          accessibilityHint={subtitle}
          value={switchValue}
          onValueChange={(v) => {
            selection();
            onSwitchChange(v);
          }}
          trackColor={{ true: colors.primary, false: colors.track }}
          thumbColor={colors.surface}
          ios_backgroundColor={colors.track}
        />
      </View>
    );
  }
  const trailing = (
    <>
      {value ? (
        <Text style={styles.settingsValue} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {children}
      {onPress ? <Icon name="chevronRight" size={16} color={colors.outline} /> : null}
    </>
  );
  if (!onPress) {
    return (
      <View testID={testID} style={styles.settingsRow}>
        {lead}
        {text}
        {trailing}
      </View>
    );
  }
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={[title, value, subtitle].filter(Boolean).join(", ")}
      onPress={onPress}
      style={({ pressed }) => [styles.settingsRow, pressed ? { backgroundColor: colors.primarySoft } : null]}
    >
      {lead}
      {text}
      {trailing}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconButton: { minWidth: TOUCH, minHeight: TOUCH, alignItems: "center", justifyContent: "center" },
  iconButtonDisc: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: TOUCH },
  sectionDetail: { fontFamily: fonts.regular, fontSize: 15, color: colors.textMuted },
  searchRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  searchField: {
    flex: 1,
    minHeight: TOUCH,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.searchBg,
    borderWidth: 2,
    borderColor: "transparent",
  },
  searchFieldFocused: { borderColor: colors.primary },
  searchInput: { flex: 1, minWidth: 0, fontFamily: fonts.regular, fontSize: 17, color: colors.text, paddingVertical: spacing.sm },
  searchClear: { padding: 2 },
  searchCancel: { minHeight: TOUCH, justifyContent: "center" },
  searchCancelText: { fontFamily: fonts.semibold, fontSize: 17, color: colors.primary },
  segmented: {
    flexDirection: "row",
    backgroundColor: colors.searchBg,
    borderRadius: radius.md,
    padding: 3,
    minHeight: TOUCH,
  },
  segment: { flex: 1, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, paddingHorizontal: spacing.xs },
  segmentSelected: { backgroundColor: colors.surface, ...shadow.segment },
  segmentText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  segmentTextSelected: { fontFamily: fonts.bold },
  chip: {
    minHeight: TOUCH,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    ...shadow.raised,
  },
  chipOn: { backgroundColor: colors.primary },
  chipText: { fontFamily: fonts.regular, fontSize: 15, color: colors.text },
  chipTextOn: { fontFamily: fonts.bold, color: colors.onPrimary },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 2,
    ...shadow.raised,
  },
  stepperInput: {
    minWidth: 56,
    minHeight: TOUCH,
    textAlign: "center",
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.text,
    paddingVertical: 0,
  },
  macro: { flex: 1, gap: spacing.xs },
  macroValue: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 20, color: colors.text },
  macroTarget: { fontFamily: fonts.regular, color: colors.textMuted },
  macroTrack: { height: 4, borderRadius: 2, backgroundColor: palette.track, overflow: "hidden" },
  macroFill: { height: 4, borderRadius: 2 },
  settingsRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  settingsValue: { fontFamily: fonts.semibold, fontSize: 16, color: colors.textMuted, maxWidth: "50%" },
});
