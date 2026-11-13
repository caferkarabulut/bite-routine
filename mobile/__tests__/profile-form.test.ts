import { birthYearRange, numberToText, validateProfileForm, valuesFromProfile, EMPTY_VALUES, type ProfileFormValues } from "../src/features/profile/useProfileForm";
import type { Profile } from "../src/types";

const YEAR = 2026;
const valid: ProfileFormValues = {
  birthYear: "1990",
  sex: "female",
  heightCm: "165",
  weightKg: "62,5",
  activity: "light",
  goal: "maintain",
  kcalOverride: "",
  proteinOverride: "",
};

describe("validateProfileForm", () => {
  it("builds a ProfileInput from valid text with a Turkish decimal comma", () => {
    const { errors, input } = validateProfileForm(valid, YEAR);
    expect(errors).toEqual({});
    expect(input).toEqual({
      birthYear: 1990,
      sex: "female",
      heightCm: 165,
      weightKg: 62.5,
      activity: "light",
      goal: "maintain",
      kcalOverride: null,
      proteinOverride: null,
    });
  });

  it("flags everything as required on an empty form", () => {
    const { errors, input } = validateProfileForm(EMPTY_VALUES, YEAR);
    expect(input).toBeNull();
    expect(Object.keys(errors).sort()).toEqual(["activity", "birthYear", "goal", "heightCm", "sex", "weightKg"]);
    expect(errors.birthYear).toBe("required");
  });

  it("checks ranges", () => {
    const { min, max } = birthYearRange(YEAR);
    expect(validateProfileForm({ ...valid, birthYear: String(min - 1) }, YEAR).errors.birthYear).toBe("range");
    expect(validateProfileForm({ ...valid, birthYear: String(max + 1) }, YEAR).errors.birthYear).toBe("range");
    expect(validateProfileForm({ ...valid, birthYear: String(min) }, YEAR).input).not.toBeNull();
    expect(validateProfileForm({ ...valid, birthYear: "90" }, YEAR).errors.birthYear).toBe("invalid");
    expect(validateProfileForm({ ...valid, heightCm: "99" }, YEAR).errors.heightCm).toBe("range");
    expect(validateProfileForm({ ...valid, heightCm: "251" }, YEAR).errors.heightCm).toBe("range");
    expect(validateProfileForm({ ...valid, weightKg: "29,9" }, YEAR).errors.weightKg).toBe("range");
    expect(validateProfileForm({ ...valid, weightKg: "301" }, YEAR).errors.weightKg).toBe("range");
    expect(validateProfileForm({ ...valid, weightKg: "abc" }, YEAR).errors.weightKg).toBe("invalid");
    expect(validateProfileForm({ ...valid, weightKg: "1,2,3" }, YEAR).errors.weightKg).toBe("invalid");
  });

  it("treats empty overrides as null and rounds filled ones", () => {
    const { input } = validateProfileForm({ ...valid, kcalOverride: "1850,4", proteinOverride: "120" }, YEAR);
    expect(input?.kcalOverride).toBe(1850);
    expect(input?.proteinOverride).toBe(120);
  });

  it("rejects bad overrides", () => {
    expect(validateProfileForm({ ...valid, kcalOverride: "0" }, YEAR).errors.kcalOverride).toBe("invalid");
    expect(validateProfileForm({ ...valid, kcalOverride: "20001" }, YEAR).errors.kcalOverride).toBe("invalid");
    expect(validateProfileForm({ ...valid, proteinOverride: "2001" }, YEAR).errors.proteinOverride).toBe("invalid");
    expect(validateProfileForm({ ...valid, proteinOverride: "x" }, YEAR).input).toBeNull();
  });
});

describe("valuesFromProfile", () => {
  it("prefills text with a comma decimal and empty overrides", () => {
    const p: Profile = {
      birthYear: 1985,
      sex: "male",
      heightCm: 180,
      weightKg: 80.5,
      activity: "active",
      goal: "gain",
      kcalOverride: 2800,
      proteinOverride: null,
      createdAt: "",
      updatedAt: "",
    };
    expect(valuesFromProfile(p)).toEqual({
      birthYear: "1985",
      sex: "male",
      heightCm: "180",
      weightKg: "80,5",
      activity: "active",
      goal: "gain",
      kcalOverride: "2800",
      proteinOverride: "",
    });
    expect(numberToText(null)).toBe("");
  });
});
