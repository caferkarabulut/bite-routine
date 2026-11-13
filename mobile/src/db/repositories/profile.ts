import type { ActivityLevel, Goal, Profile, Sex } from "../../types";
import type { Db } from "../types";
import {
  ACTIVITIES,
  GOALS,
  SEXES,
  assertKg,
  assertValue,
  isFiniteNumber,
  isOneOf,
  nowIso,
} from "../validation";

type ProfileRow = {
  birth_year: number;
  sex: string;
  height_cm: number;
  weight_kg: number;
  activity: string;
  goal: string;
  kcal_override: number | null;
  protein_override: number | null;
  created_at: string;
  updated_at: string;
};

export type ProfileInput = Omit<Profile, "createdAt" | "updatedAt">;

function rowToProfile(r: ProfileRow): Profile {
  return {
    birthYear: r.birth_year,
    sex: r.sex as Sex,
    heightCm: r.height_cm,
    weightKg: r.weight_kg,
    activity: r.activity as ActivityLevel,
    goal: r.goal as Goal,
    kcalOverride: r.kcal_override,
    proteinOverride: r.protein_override,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function assertProfileInput(p: ProfileInput): void {
  assertValue(Number.isInteger(p.birthYear) && p.birthYear >= 1900 && p.birthYear <= 2200, "birthYear out of range");
  assertValue(isOneOf(SEXES, p.sex), "sex must be female or male");
  assertValue(isFiniteNumber(p.heightCm) && p.heightCm >= 50 && p.heightCm <= 260, "heightCm must be 50-260");
  assertKg(p.weightKg);
  assertValue(isOneOf(ACTIVITIES, p.activity), "invalid activity level");
  assertValue(isOneOf(GOALS, p.goal), "invalid goal");
  assertValue(
    p.kcalOverride === null || (isFiniteNumber(p.kcalOverride) && p.kcalOverride > 0 && p.kcalOverride <= 20000),
    "kcalOverride must be null or 1-20000",
  );
  assertValue(
    p.proteinOverride === null || (isFiniteNumber(p.proteinOverride) && p.proteinOverride > 0 && p.proteinOverride <= 2000),
    "proteinOverride must be null or 1-2000",
  );
}

export async function getProfile(db: Db): Promise<Profile | null> {
  const row = await db.getFirstAsync<ProfileRow>("SELECT * FROM profile WHERE id = 1", []);
  return row ? rowToProfile(row) : null;
}

/** Creates or replaces the single profile row; createdAt is kept on update. */
export async function saveProfile(db: Db, input: ProfileInput): Promise<Profile> {
  assertProfileInput(input);
  const now = nowIso();
  await db.runAsync(
    `INSERT INTO profile (id, birth_year, sex, height_cm, weight_kg, activity, goal,
       kcal_override, protein_override, created_at, updated_at)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       birth_year = excluded.birth_year, sex = excluded.sex, height_cm = excluded.height_cm,
       weight_kg = excluded.weight_kg, activity = excluded.activity, goal = excluded.goal,
       kcal_override = excluded.kcal_override, protein_override = excluded.protein_override,
       updated_at = excluded.updated_at`,
    [
      input.birthYear,
      input.sex,
      input.heightCm,
      input.weightKg,
      input.activity,
      input.goal,
      input.kcalOverride,
      input.proteinOverride,
      now,
      now,
    ],
  );
  return (await getProfile(db)) as Profile;
}
