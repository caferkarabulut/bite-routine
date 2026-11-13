import { useCallback, useMemo, useState } from "react";

import type { ProfileInput } from "../../db";
import { calculateTargets, parseAmount } from "../../domain";
import type { ActivityLevel, Goal, Profile, Sex, Targets } from "../../types";

export type ProfileFormValues = {
  birthYear: string;
  sex: Sex | null;
  heightCm: string;
  weightKg: string;
  activity: ActivityLevel | null;
  goal: Goal | null;
  kcalOverride: string;
  proteinOverride: string;
};

export type ProfileField = keyof ProfileFormValues;
export type FieldErrorCode = "required" | "range" | "invalid";
export type ProfileFormErrors = Partial<Record<ProfileField, FieldErrorCode>>;

export const HEIGHT_RANGE = { min: 100, max: 250 } as const;
export const WEIGHT_RANGE = { min: 30, max: 300 } as const;
export const MAX_KCAL_OVERRIDE = 20000;
export const MAX_PROTEIN_OVERRIDE = 2000;

export const SEXES: readonly Sex[] = ["female", "male"];
export const ACTIVITIES: readonly ActivityLevel[] = ["sedentary", "light", "moderate", "active", "very_active"];
export const GOALS: readonly Goal[] = ["lose", "maintain", "gain"];

export const EMPTY_VALUES: ProfileFormValues = {
  birthYear: "",
  sex: null,
  heightCm: "",
  weightKg: "",
  activity: null,
  goal: null,
  kcalOverride: "",
  proteinOverride: "",
};

/** Allowed birth years for a given calendar year (age 10 to 110). */
export function birthYearRange(currentYear: number): { min: number; max: number } {
  return { min: currentYear - 110, max: currentYear - 10 };
}

/** Formats a number for a text field: the decimal point becomes a Turkish comma. */
export function numberToText(n: number | null): string {
  return n === null ? "" : String(n).replace(".", ",");
}

export function valuesFromProfile(profile: Profile): ProfileFormValues {
  return {
    birthYear: String(profile.birthYear),
    sex: profile.sex,
    heightCm: numberToText(profile.heightCm),
    weightKg: numberToText(profile.weightKg),
    activity: profile.activity,
    goal: profile.goal,
    kcalOverride: numberToText(profile.kcalOverride),
    proteinOverride: numberToText(profile.proteinOverride),
  };
}

type Parsed = { value: number | null; error: FieldErrorCode | null };

function ranged(text: string, min: number, max: number): Parsed {
  if (text.trim() === "") return { value: null, error: "required" };
  const n = parseAmount(text);
  if (n === null) return { value: null, error: "invalid" };
  if (n < min || n > max) return { value: null, error: "range" };
  return { value: n, error: null };
}

function override(text: string, max: number): Parsed {
  if (text.trim() === "") return { value: null, error: null };
  const n = parseAmount(text);
  if (n === null || n > max) return { value: null, error: "invalid" };
  const rounded = Math.round(n);
  return rounded >= 1 ? { value: rounded, error: null } : { value: null, error: "invalid" };
}

/**
 * Validates form text. `input` is set only when every field is valid.
 * Limits are at least as strict as the database's `assertProfileInput`.
 */
export function validateProfileForm(
  values: ProfileFormValues,
  currentYear: number,
): { errors: ProfileFormErrors; input: ProfileInput | null } {
  const errors: ProfileFormErrors = {};

  const { min, max } = birthYearRange(currentYear);
  let birthYear: number | null = null;
  const yearText = values.birthYear.trim();
  if (yearText === "") errors.birthYear = "required";
  else if (!/^\d{4}$/.test(yearText)) errors.birthYear = "invalid";
  else {
    const y = Number(yearText);
    if (y < min || y > max) errors.birthYear = "range";
    else birthYear = y;
  }

  const height = ranged(values.heightCm, HEIGHT_RANGE.min, HEIGHT_RANGE.max);
  if (height.error) errors.heightCm = height.error;
  const weight = ranged(values.weightKg, WEIGHT_RANGE.min, WEIGHT_RANGE.max);
  if (weight.error) errors.weightKg = weight.error;
  if (values.sex === null) errors.sex = "required";
  if (values.activity === null) errors.activity = "required";
  if (values.goal === null) errors.goal = "required";
  const kcal = override(values.kcalOverride, MAX_KCAL_OVERRIDE);
  if (kcal.error) errors.kcalOverride = kcal.error;
  const protein = override(values.proteinOverride, MAX_PROTEIN_OVERRIDE);
  if (protein.error) errors.proteinOverride = protein.error;

  if (
    Object.keys(errors).length > 0 ||
    birthYear === null ||
    height.value === null ||
    weight.value === null ||
    values.sex === null ||
    values.activity === null ||
    values.goal === null
  ) {
    return { errors, input: null };
  }
  return {
    errors,
    input: {
      birthYear,
      sex: values.sex,
      heightCm: height.value,
      weightKg: weight.value,
      activity: values.activity,
      goal: values.goal,
      kcalOverride: kcal.value,
      proteinOverride: protein.value,
    },
  };
}

/** Targets from the base fields with overrides ignored, or null while invalid. */
export function calculatedTargets(input: ProfileInput | null, today: string): Targets | null {
  return input ? calculateTargets({ ...input, kcalOverride: null, proteinOverride: null }, today) : null;
}

export function useProfileForm(initial: ProfileFormValues, currentYear: number, today: string) {
  const [values, setValues] = useState<ProfileFormValues>(initial);
  const [attempted, setAttempted] = useState(false);

  const setValue = useCallback(<K extends ProfileField>(field: K, value: ProfileFormValues[K]) => {
    setValues((v) => ({ ...v, [field]: value }));
  }, []);

  const { errors, input } = useMemo(() => validateProfileForm(values, currentYear), [values, currentYear]);
  const calculated = useMemo(() => calculatedTargets(input, today), [input, today]);
  const targets = useMemo(() => (input ? calculateTargets(input, today) : null), [input, today]);

  /** Errors show once the field has content, or for everything after a submit attempt. */
  const visibleErrors = useMemo<ProfileFormErrors>(() => {
    if (attempted) return errors;
    const out: ProfileFormErrors = {};
    for (const key of Object.keys(errors) as ProfileField[]) {
      const code = errors[key];
      if (code && code !== "required" && String(values[key] ?? "").trim() !== "") out[key] = code;
    }
    return out;
  }, [attempted, errors, values]);

  const markAttempted = useCallback(() => setAttempted(true), []);

  return { values, setValue, errors, visibleErrors, input, calculated, targets, attempted, markAttempted };
}
