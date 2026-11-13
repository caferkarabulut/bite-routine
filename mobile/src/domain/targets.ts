import type { ActivityLevel, Goal, LocalDate, Profile, Sex, Targets } from "../types";

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const GOAL_ADJUSTMENT_KCAL: Record<Goal, number> = { lose: -500, maintain: 0, gain: 300 };

export const KCAL_FLOOR: Record<Sex, number> = { female: 1200, male: 1500 };

export const PROTEIN_PER_KG: Record<Goal, number> = { lose: 1.6, maintain: 1.2, gain: 1.6 };

export const FAT_ENERGY_SHARE = 0.3;
export const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 } as const;

export type TargetProfile = Pick<
  Profile,
  "birthYear" | "sex" | "heightCm" | "weightKg" | "activity" | "goal" | "kcalOverride" | "proteinOverride"
>;

/** Age by calendar-year difference (birthYear vs the year of `today`). */
export function ageFromBirthYear(birthYear: number, today: LocalDate): number {
  return Number(today.slice(0, 4)) - birthYear;
}

/** Mifflin-St Jeor basal metabolic rate in kcal/day (unrounded). */
export function bmr(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  return 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === "male" ? 5 : -161);
}

/** Total daily energy expenditure in kcal/day (unrounded). */
export function tdee(bmrKcal: number, activity: ActivityLevel): number {
  return bmrKcal * ACTIVITY_FACTORS[activity];
}

/** Daily kcal and macro targets; integers in kcal and grams. */
export function calculateTargets(profile: TargetProfile, today: LocalDate): Targets {
  const age = ageFromBirthYear(profile.birthYear, today);
  const base = tdee(bmr(profile.sex, profile.weightKg, profile.heightCm, age), profile.activity);
  const calculated = Math.max(KCAL_FLOOR[profile.sex], Math.round(base + GOAL_ADJUSTMENT_KCAL[profile.goal]));
  const kcal = Math.round(profile.kcalOverride ?? calculated);
  const protein = Math.round(profile.proteinOverride ?? profile.weightKg * PROTEIN_PER_KG[profile.goal]);
  const fat = Math.round((kcal * FAT_ENERGY_SHARE) / KCAL_PER_G.fat);
  const carbs = Math.max(0, Math.round((kcal - protein * KCAL_PER_G.protein - fat * KCAL_PER_G.fat) / KCAL_PER_G.carbs));
  return { kcal, protein, carbs, fat };
}
