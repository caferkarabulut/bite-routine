import { gramsForPortion, nutrientsForGrams, parseAmount, remaining, sumNutrients } from "../src/domain";

describe("nutrientsForGrams", () => {
  it("scales per-100 g values", () => {
    expect(nutrientsForGrams({ kcal: 200, protein: 10, carbs: 30, fat: 5 }, 150)).toEqual({
      kcal: 300,
      protein: 15,
      carbs: 45,
      fat: 7.5,
    });
  });

  it("keeps null fields null and zero as zero", () => {
    expect(nutrientsForGrams({ kcal: 100, protein: null, carbs: 0, fat: null }, 50)).toEqual({
      kcal: 50,
      protein: null,
      carbs: 0,
      fat: null,
    });
  });
});

describe("sumNutrients", () => {
  it("returns zeros for an empty list", () => {
    expect(sumNutrients([])).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
  });

  it("sums per field", () => {
    expect(
      sumNutrients([
        { kcal: 100, protein: 1, carbs: 2, fat: 3 },
        { kcal: 50, protein: 2, carbs: 3, fat: 4 },
      ]),
    ).toEqual({ kcal: 150, protein: 3, carbs: 5, fat: 7 });
  });

  it("propagates null only to the affected field", () => {
    expect(
      sumNutrients([
        { kcal: 100, protein: null, carbs: 2, fat: 3 },
        { kcal: 50, protein: 2, carbs: 3, fat: null },
      ]),
    ).toEqual({ kcal: 150, protein: null, carbs: 5, fat: null });
  });
});

describe("gramsForPortion", () => {
  it("multiplies grams by quantity", () => {
    expect(gramsForPortion(150, 2)).toBe(300);
    expect(gramsForPortion(30, 0.5)).toBe(15);
  });

  it("rounds to 2 decimals, half away from zero", () => {
    expect(gramsForPortion(1.005, 1)).toBe(1.01);
    expect(gramsForPortion(33.333, 1)).toBe(33.33);
    expect(gramsForPortion(100, 1 / 3)).toBe(33.33);
    expect(gramsForPortion(-1.005, 1)).toBe(-1.01);
    expect(gramsForPortion(0, 5)).toBe(0);
  });
});

describe("remaining", () => {
  const targets = { kcal: 2000, protein: 100, carbs: 250, fat: 70 };

  it("subtracts consumed", () => {
    expect(remaining(targets, { kcal: 500, protein: 20, carbs: 50, fat: 10 })).toEqual({
      kcal: 1500,
      protein: 80,
      carbs: 200,
      fat: 60,
    });
  });

  it("goes negative when exceeded and treats null as nothing consumed", () => {
    expect(remaining(targets, { kcal: 2500, protein: null, carbs: 0, fat: 80 })).toEqual({
      kcal: -500,
      protein: 100,
      carbs: 250,
      fat: -10,
    });
  });
});

describe("parseAmount", () => {
  it.each([
    ["150", 150],
    [" 150 ", 150],
    ["1,5", 1.5],
    ["1.5", 1.5],
    ["0,25", 0.25],
    [",5", 0.5],
    ["10000", 10000],
    ["0.01", 0.01],
  ])("accepts %j", (input, expected) => {
    expect(parseAmount(input)).toBe(expected);
  });

  it.each([
    "",
    "   ",
    "abc",
    "12abc",
    "1 5",
    "1,2,3",
    "1.2.3",
    "1,2.3",
    "1.000,5",
    "0",
    "0,0",
    "-1",
    "+1",
    "1e3",
    "NaN",
    "Infinity",
    "10000.01",
    "10001",
    "5,",
    ",",
  ])("rejects %j", (input) => {
    expect(parseAmount(input)).toBeNull();
  });
});
