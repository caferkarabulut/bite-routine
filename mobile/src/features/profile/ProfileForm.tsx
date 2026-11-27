import { useState, type ReactNode } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { formatGrams, formatKcal, useI18n, type TFunction } from "../../i18n";
import type { Targets } from "../../types";
import { Button, Card, Divider, Icon, Screen, TextField, colors, fonts, radius, spacing, typography, TOUCH } from "../../ui";
import {
  ACTIVITIES,
  GOALS,
  SEXES,
  birthYearRange,
  type FieldErrorCode,
  type ProfileField,
  type ProfileFormErrors,
  type ProfileFormValues,
} from "./useProfileForm";

export type FormApi = {
  values: ProfileFormValues;
  setValue: <K extends ProfileField>(field: K, value: ProfileFormValues[K]) => void;
  visibleErrors: ProfileFormErrors;
};

function errorText(t: TFunction, field: ProfileField, code: FieldErrorCode | undefined, currentYear: number): string | null {
  if (!code) return null;
  if (code === "required") return t("profile.errors.required");
  if (field === "birthYear") {
    const { min, max } = birthYearRange(currentYear);
    return t("profile.errors.birthYear", { min, max });
  }
  if (field === "heightCm") return t("profile.errors.height");
  if (field === "weightKg") return t("profile.errors.weight");
  if (field === "kcalOverride" || field === "proteinOverride") return t("profile.errors.override");
  return t("errors.invalidNumber");
}

/** Compact row that reveals the existing choices and their explanations. */
function OptionList<T extends string>({ label, options, value, onChange, error }: {
  label: string;
  options: { value: T; label: string; hint: string }[];
  value: T | null;
  onChange: (v: T) => void;
  error: string | null;
}) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: selected?.label ?? t("features.profile.choose") }}
        accessibilityState={{ expanded }}
        onPress={() => setExpanded(!expanded)}
        style={styles.choiceRow}
      >
        <View style={styles.choiceText}>
          <Text style={typography.footnote}>{label}</Text>
          <Text style={typography.bodyStrong}>{selected?.label ?? t("features.profile.choose")}</Text>
        </View>
        <Icon name={expanded ? "minus" : "chevronRight"} size={18} />
      </Pressable>
      {expanded ? (
        <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.options}>
          {options.map((o) => (
            <Pressable
              key={o.value}
              accessibilityRole="radio"
              accessibilityState={{ selected: o.value === value, checked: o.value === value }}
              accessibilityLabel={`${o.label}, ${o.hint}`}
              onPress={() => { onChange(o.value); setExpanded(false); }}
              style={[styles.option, o.value === value ? styles.optionSelected : null]}
            >
              <View style={styles.choiceText}>
                <Text style={typography.bodyStrong}>{o.label}</Text>
                <Text style={typography.footnote}>{o.hint}</Text>
              </View>
              {o.value === value ? <Icon name="check" size={18} /> : null}
            </Pressable>
          ))}
        </View>
      ) : null}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function ProfileFields({ form, currentYear }: { form: FormApi; currentYear: number }) {
  const { t } = useI18n();
  const { values, setValue, visibleErrors: e } = form;
  const range = birthYearRange(currentYear);
  return (
    <View style={{ gap: spacing.md }}>
      <Card style={{ gap: spacing.sm }}>
        <View style={styles.gridRow}>
          <View style={styles.cell}>
            <TextField
              testID="onboarding-birth-year"
              label={t("profile.birthYear")}
              value={values.birthYear}
              onChangeText={(v) => setValue("birthYear", v.replace(/[^0-9]/g, "").slice(0, 4))}
              keyboardType="number-pad"
              inputMode="numeric"
              maxLength={4}
              placeholder={String(range.max - 20)}
              error={errorText(t, "birthYear", e.birthYear, currentYear)}
            />
          </View>
          <View style={styles.cell}>
            <Text style={typography.label}>{t("sex.label")}</Text>
            <View accessibilityRole="radiogroup" accessibilityLabel={t("sex.label")} style={styles.sexRow}>
              {SEXES.map((sex) => (
                <Pressable
                  key={sex}
                  accessibilityRole="radio"
                  accessibilityLabel={t(`sex.${sex}`)}
                  accessibilityHint={t("sex.hint")}
                  accessibilityState={{ selected: values.sex === sex, checked: values.sex === sex }}
                  onPress={() => setValue("sex", sex)}
                  style={[styles.sex, values.sex === sex ? styles.sexSelected : null]}
                >
                  <Text style={[styles.sexText, values.sex === sex ? { color: colors.onPrimary } : null]}>{t(`sex.${sex}`)}</Text>
                </Pressable>
              ))}
            </View>
            {e.sex ? <Text accessibilityRole="alert" style={styles.error}>{t("profile.errors.required")}</Text> : null}
          </View>
        </View>
        <View style={styles.gridRow}>
          <View style={styles.cell}>
            <TextField
              testID="onboarding-height"
              label={t("profile.height")}
              value={values.heightCm}
              onChangeText={(v) => setValue("heightCm", v)}
              keyboardType="decimal-pad"
              inputMode="decimal"
              error={errorText(t, "heightCm", e.heightCm, currentYear)}
            />
          </View>
          <View style={styles.cell}>
            <TextField
              testID="onboarding-weight"
              label={t("profile.weight")}
              value={values.weightKg}
              onChangeText={(v) => setValue("weightKg", v)}
              keyboardType="decimal-pad"
              inputMode="decimal"
              error={errorText(t, "weightKg", e.weightKg, currentYear)}
            />
          </View>
        </View>
      </Card>
      <Card padded={false} style={{ gap: 0 }}>
        <OptionList
          label={t("activity.label")}
          options={ACTIVITIES.map((a) => ({ value: a, label: t(`activity.${a}`), hint: t(`activity.${a}Hint`) }))}
          value={values.activity}
          onChange={(v) => setValue("activity", v)}
          error={e.activity ? t("profile.errors.required") : null}
        />
        <Divider inset={spacing.lg} />
        <OptionList
          label={t("goal.label")}
          options={GOALS.map((g) => ({ value: g, label: t(`goal.${g}`), hint: t(`goal.${g}Hint`) }))}
          value={values.goal}
          onChange={(v) => setValue("goal", v)}
          error={e.goal ? t("profile.errors.required") : null}
        />
      </Card>
    </View>
  );
}

/** Optional kcal / protein overrides with the calculated values as hints. */
export function OverrideFields({
  form,
  calculated,
  currentYear,
}: {
  form: FormApi;
  calculated: Targets | null;
  currentYear: number;
}) {
  const { t, lang } = useI18n();
  const { values, setValue, visibleErrors: e } = form;
  const hasOverride = values.kcalOverride.trim() !== "" || values.proteinOverride.trim() !== "";
  return (
    <View style={{ gap: spacing.md }}>
      <Text style={typography.muted}>{t("targets.overrideHint")}</Text>
      <TextField
        label={t("features.profile.overrideKcal")}
        value={values.kcalOverride}
        onChangeText={(v) => setValue("kcalOverride", v)}
        keyboardType="number-pad"
        inputMode="numeric"
        placeholder={calculated ? String(calculated.kcal) : undefined}
        hint={calculated ? t("features.profile.calculatedValue", { value: formatKcal(calculated.kcal, lang) }) : undefined}
        error={errorText(t, "kcalOverride", e.kcalOverride, currentYear)}
      />
      <TextField
        label={t("features.profile.overrideProtein")}
        value={values.proteinOverride}
        onChangeText={(v) => setValue("proteinOverride", v)}
        keyboardType="number-pad"
        inputMode="numeric"
        placeholder={calculated ? String(calculated.protein) : undefined}
        hint={calculated ? t("features.profile.calculatedValue", { value: formatGrams(calculated.protein, lang) }) : undefined}
        error={errorText(t, "proteinOverride", e.proteinOverride, currentYear)}
      />
      {hasOverride ? (
        <Button
          label={t("targets.reset")}
          variant="secondary"
          onPress={() => {
            setValue("kcalOverride", "");
            setValue("proteinOverride", "");
          }}
        />
      ) : null}
    </View>
  );
}

/** Compact summary; overrides stay hidden until explicitly requested. */
export function TargetsCard({ title, form, currentYear }: { title: string; form: FormApi & { targets: Targets | null; calculated: Targets | null }; currentYear: number }) {
  const { t, lang } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const { targets } = form;
  const invalidOverride = !!(form.visibleErrors.kcalOverride || form.visibleErrors.proteinOverride);
  const showOverrides = expanded || invalidOverride;
  return (
    <Card style={{ gap: spacing.sm }}>
      <View style={styles.summary}>
        <Text accessibilityRole="header" style={[typography.label, { flexShrink: 1 }]}>{title}</Text>
        {targets ? <Text style={styles.kcal}>{formatKcal(targets.kcal, lang)}</Text> : null}
      </View>
      {targets ? (
        <View style={styles.macros}>
          {(["protein", "carbs", "fat"] as const).map((macro) => (
            <View key={macro} style={styles.macro}>
              <Text style={typography.footnote}>
                {macro === "carbs" ? t("features.profile.carbsShort") : t(`macros.${macro}`)}{" "}
                <Text style={typography.label}>{formatGrams(targets[macro], lang)}</Text>
              </Text>
            </View>
          ))}
        </View>
      ) : <Text style={typography.muted}>{t("features.profile.previewEmpty")}</Text>}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("features.profile.manualTargets")}
        accessibilityState={{ expanded: showOverrides }}
        onPress={() => setExpanded(!showOverrides)}
        style={styles.manualLink}
      >
        <Text style={styles.linkText}>{t("features.profile.manualTargets")}</Text>
      </Pressable>
      {showOverrides ? <OverrideFields form={form} calculated={form.calculated} currentYear={currentYear} /> : null}
    </Card>
  );
}

/** Screen scaffold with the same centred header and sticky action on both forms. */
export function FormScreen({ children, title, subtitle, headerBelow, headerLeft, footer }: {
  children: ReactNode;
  title: string;
  subtitle?: ReactNode;
  headerBelow?: ReactNode;
  headerLeft?: ReactNode;
  footer: ReactNode;
}) {
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Screen edges={["top", "bottom"]} largeTitle={title} centerHeader subtitle={subtitle} headerBelow={headerBelow} headerLeft={headerLeft} footer={footer}>
        {children}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  gridRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  cell: { flex: 1, minWidth: 0, gap: spacing.xs },
  sexRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  sex: { flexGrow: 1, flexBasis: 52, minHeight: TOUCH, padding: spacing.xs, borderRadius: radius.sm, backgroundColor: colors.searchBg, alignItems: "center", justifyContent: "center" },
  sexSelected: { backgroundColor: colors.primary },
  sexText: { ...typography.label, textAlign: "center" },
  choiceRow: { minHeight: 60, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  choiceText: { flex: 1, minWidth: 0 },
  options: { padding: spacing.sm, gap: spacing.xs },
  option: { minHeight: TOUCH, padding: spacing.sm, borderRadius: radius.sm, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  optionSelected: { backgroundColor: colors.searchBg },
  error: { ...typography.small, color: colors.danger },
  summary: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  kcal: { fontFamily: fonts.extrabold, fontSize: 22, lineHeight: 28, color: colors.accentText, fontVariant: ["tabular-nums"] },
  macros: { flexDirection: "row", gap: spacing.sm },
  macro: { flex: 1, minWidth: 0 },
  manualLink: { minHeight: TOUCH, justifyContent: "center", alignSelf: "flex-start" },
  linkText: { ...typography.label, textDecorationLine: "underline" },
});
