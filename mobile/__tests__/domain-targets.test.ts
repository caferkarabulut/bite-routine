import { ACTIVITY_FACTORS, bmr, calculateTargets, tdee, type TargetProfile } from "../src/domain";

const TODAY = "2026-11-13";

function profile(overrides: Partial<TargetProfile> = {}): TargetProfile {
  return {
    birthYear: 1996,
    sex: "male",
    heightCm: 180,
    weightKg: 80,
    activity: "moderate",
    goal: "maintain",
    kcalOverride: null,
    proteinOverride: null,
    ...overrides,
  };
}

describe("bmr / tdee", () => {
  it("applies Mifflin-St Jeor for men and women", () => {
    // 10*80 + 6.25*180 - 5*30 + 5
    expect(bmr("male", 80, 180, 30)).toBe(1780);
    // 10*60 + 6.25*165 - 5*30 - 161
    expect(bmr("female", 60, 165, 30)).toBe(1320.25);
  });

  it("multiplies by the activity factor", () => {
    expect(tdee(1000, "sedentary")).toBe(1200);
    expect(tdee(1000, "very_active")).toBe(1900);
    expect(Object.values(ACTIVITY_FACTORS)).toEqual([1.2, 1.375, 1.55, 1.725, 1.9]);
  });
});

describe("calculateTargets", () => {
  it("maintains: man 30y 180cm 80kg moderate", () => {
    // tdee 1780*1.55 = 2759; protein 96; fat 2759*.3/9 = 91.97 -> 92
    // carbs (2759 - 384 - 828)/4 = 386.75 -> 387
    expect(calculateTargets(profile(), TODAY)).toEqual({ kcal: 2759, protein: 96, carbs: 387, fat: 92 });
  });

  it("uses the year of today for age", () => {
    // age 31 in 2027: bmr 1775 * 1.55 = 2751.25 -> 2751
    expect(calculateTargets(profile(), "2027-01-01").kcal).toBe(2751);
  });

  it("gain adds 300 kcal and 1.6 g/kg protein: light activity", () => {
    // 1780*1.375 = 2447.5 + 300 = 2747.5 -> 2748; protein 128; fat 91.6 -> 92
    // carbs (2748 - 512 - 828)/4 = 352
    expect(calculateTargets(profile({ activity: "light", goal: "gain" }), TODAY)).toEqual({
      kcal: 2748,
      protein: 128,
      carbs: 352,
      fat: 92,
    });
  });

  it("lose subtracts 500 kcal: woman 40y 170cm 70kg moderate", () => {
    // bmr 700 + 1062.5 - 200 - 161 = 1401.5; *1.55 = 2172.325; -500 = 1672.3 -> 1672
    // protein 112; fat 1672*.3/9 = 55.7 -> 56; carbs (1672 - 448 - 504)/4 = 180
    expect(
      calculateTargets(profile({ sex: "female", birthYear: 1986, heightCm: 170, weightKg: 70, activity: "moderate", goal: "lose" }), TODAY),
    ).toEqual({ kcal: 1672, protein: 112, carbs: 180, fat: 56 });
  });

  it("raises a woman's kcal to the 1200 floor", () => {
    // bmr 1320.25 * 1.2 = 1584.3 - 500 = 1084.3 -> floor 1200
    const t = calculateTargets(
      profile({ sex: "female", heightCm: 165, weightKg: 60, activity: "sedentary", goal: "lose" }),
      TODAY,
    );
    // protein 96; fat 40; carbs (1200 - 384 - 360)/4 = 114
    expect(t).toEqual({ kcal: 1200, protein: 96, carbs: 114, fat: 40 });
  });

  it("raises a man's kcal to the 1500 floor", () => {
    // bmr 10*50 + 6.25*150 - 5*60 + 5 = 1142.5; *1.2 = 1371 - 500 = 871 -> 1500
    const t = calculateTargets(
      profile({ birthYear: 1966, heightCm: 150, weightKg: 50, activity: "sedentary", goal: "lose" }),
      TODAY,
    );
    expect(t.kcal).toBe(1500);
  });

  it("applies overrides and redistributes the rest", () => {
    // kcal 2000, protein 150: fat 2000*.3/9 = 66.67 -> 67; carbs (2000 - 600 - 603)/4 = 199.25 -> 199
    expect(calculateTargets(profile({ kcalOverride: 2000, proteinOverride: 150 }), TODAY)).toEqual({
      kcal: 2000,
      protein: 150,
      carbs: 199,
      fat: 67,
    });
  });

  it("uses a kcal override without the floor and keeps calculated protein", () => {
    const t = calculateTargets(profile({ kcalOverride: 1000 }), TODAY);
    expect(t.kcal).toBe(1000);
    expect(t.protein).toBe(96);
    // fat 33; carbs (1000 - 384 - 297)/4 = 79.75 -> 80
    expect(t).toMatchObject({ fat: 33, carbs: 80 });
  });

  it("protein override alone keeps calculated kcal", () => {
    const t = calculateTargets(profile({ proteinOverride: 100 }), TODAY);
    expect(t.kcal).toBe(2759);
    expect(t.protein).toBe(100);
  });

  it("never returns negative carbs", () => {
    const t = calculateTargets(profile({ kcalOverride: 1000, proteinOverride: 300 }), TODAY);
    expect(t.carbs).toBe(0);
  });

  it("returns integers", () => {
    const t = calculateTargets(profile({ weightKg: 73.4, heightCm: 176.5, kcalOverride: 1999.6 }), TODAY);
    for (const v of Object.values(t)) expect(Number.isInteger(v)).toBe(true);
  });
});
