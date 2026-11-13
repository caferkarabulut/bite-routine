import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { formatGrams, formatKcal, useI18n, type TFunction } from "../../i18n";
import type { Targets } from "../../types";
import { Button, Card, ChoiceChips, Screen, SectionTitle, TextField, colors, radius, spacing, typography, TOUCH } from "../../ui";
import {
  ACTIVITIES,
  GOALS,
  HEIGHT_RANGE,
  SEXES,
  WEIGHT_RANGE,
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

/** Single-choice list where each option has a one-line hint. */
function OptionList<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
}: {
  label: string;
  options: { value: T; label: string; hint: string }[];
  value: T | null;
  onChange: (v: T) => void;
  error: string | null;
}) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={typography.label}>{label}</Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ gap: spacing.sm }}>
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${o.label}, ${o.hint}`}
              onPress={() => onChange(o.value)}
              style={[styles.option, selected ? styles.optionSelected : null]}
            >
              <Text style={[typography.body, selected ? styles.optionTitleSelected : null]}>{o.label}</Text>
              <Text style={typography.muted}>{o.hint}</Text>
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={[typography.small, { color: colors.danger }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function ProfileFields({ form, currentYear }: { form: FormApi; currentYear: number }) {
  const { t } = useI18n();
  const { values, setValue, visibleErrors: e } = form;
  const range = birthYearRange(currentYear);
  return (
    <View style={{ gap: spacing.lg }}>
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
      <View style={{ gap: spacing.xs }}>
        <ChoiceChips
          label={t("sex.label")}
          options={SEXES.map((s) => ({ value: s, label: t(`sex.${s}`) }))}
          value={values.sex}
          onChange={(v) => setValue("sex", v)}
        />
        {e.sex ? (
          <Text accessibilityRole="alert" style={[typography.small, { color: colors.danger }]}>
            {t("profile.errors.required")}
          </Text>
        ) : (
          <Text style={typography.small}>{t("sex.hint")}</Text>
        )}
      </View>
      <TextField
        testID="onboarding-height"
        label={t("profile.height")}
        value={values.heightCm}
        onChangeText={(v) => setValue("heightCm", v)}
        keyboardType="decimal-pad"
        inputMode="decimal"
        suffix={t("units.cm")}
        hint={`${HEIGHT_RANGE.min}-${HEIGHT_RANGE.max}`}
        error={errorText(t, "heightCm", e.heightCm, currentYear)}
      />
      <TextField
        testID="onboarding-weight"
        label={t("profile.weight")}
        value={values.weightKg}
        onChangeText={(v) => setValue("weightKg", v)}
        keyboardType="decimal-pad"
        inputMode="decimal"
        suffix={t("units.kg")}
        hint={`${WEIGHT_RANGE.min}-${WEIGHT_RANGE.max}`}
        error={errorText(t, "weightKg", e.weightKg, currentYear)}
      />
      <OptionList
        label={t("activity.label")}
        options={ACTIVITIES.map((a) => ({ value: a, label: t(`activity.${a}`), hint: t(`activity.${a}Hint`) }))}
        value={values.activity}
        onChange={(v) => setValue("activity", v)}
        error={e.activity ? t("profile.errors.required") : null}
      />
      <OptionList
        label={t("goal.label")}
        options={GOALS.map((g) => ({ value: g, label: t(`goal.${g}`), hint: t(`goal.${g}Hint`) }))}
        value={values.goal}
        onChange={(v) => setValue("goal", v)}
        error={e.goal ? t("profile.errors.required") : null}
      />
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
      <SectionTitle>{t("targets.override")}</SectionTitle>
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

/** Card with the daily targets and the standard explanation + disclaimer. */
export function TargetsCard({ title, targets, empty }: { title: string; targets: Targets | null; empty: string }) {
  const { t, lang } = useI18n();
  return (
    <Card>
      <Text accessibilityRole="header" style={typography.heading}>
        {title}
      </Text>
      {targets ? (
        <View style={{ gap: spacing.xs }} accessible accessibilityLabel={`${title}: ${formatKcal(targets.kcal, lang)}`}>
          <Text style={styles.kcal}>{formatKcal(targets.kcal, lang)}</Text>
          <Text style={typography.body}>
            {t("macros.protein")}: {formatGrams(targets.protein, lang)} · {t("macros.carbs")}: {formatGrams(targets.carbs, lang)} ·{" "}
            {t("macros.fat")}: {formatGrams(targets.fat, lang)}
          </Text>
        </View>
      ) : (
        <Text style={typography.muted}>{empty}</Text>
      )}
      <Text style={typography.small}>{t("targets.explain")}</Text>
      <Text style={typography.small}>{t("disclaimer")}</Text>
    </Card>
  );
}

/** Screen scaffold with keyboard avoidance. */
/** `top` is for screens without a navigation header (onboarding). */
export function FormScreen({ children, top = false }: { children: ReactNode; top?: boolean }) {
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Screen edges={top ? ["top", "bottom"] : ["bottom"]}>{children}</Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  option: {
    minHeight: TOUCH,
    padding: spacing.md,
    gap: 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft, borderWidth: 2 },
  optionTitleSelected: { fontWeight: "700" },
  kcal: { fontSize: 32, fontWeight: "700", color: colors.primary },
});
