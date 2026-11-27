import { amountStepRange, stepAmountText } from "../src/features/catalog/amountStep";
import { defaultServing, type FoodView } from "../src/features/catalog/foodView";

describe("amountStepRange", () => {
  it("steps grams by 10 from 1 up to 10000", () => {
    expect(amountStepRange(null)).toEqual({ min: 1, max: 10000, step: 10 });
  });

  it("steps portions by 0.5 from 0.5 and keeps the total within 10000 g", () => {
    expect(amountStepRange(150)).toEqual({ min: 0.5, max: 66.5, step: 0.5 });
    expect(amountStepRange(20000)).toEqual({ min: 0.5, max: 0.5, step: 0.5 });
  });
});

describe("stepAmountText", () => {
  it("adds and subtracts 0.5 portions with the language separator", () => {
    expect(stepAmountText("1", 1, 150, "tr")).toBe("1,5");
    expect(stepAmountText("1", 1, 150, "en")).toBe("1.5");
    expect(stepAmountText("1,5", -1, 150, "tr")).toBe("1");
    expect(stepAmountText("2,25", -1, 150, "tr")).toBe("1,75");
  });

  it("never goes below 0.5 portions", () => {
    expect(stepAmountText("0,5", -1, 150, "tr")).toBe("0,5");
    expect(stepAmountText("0,7", -1, 150, "tr")).toBe("0,5");
  });

  it("adds and subtracts 10 g and never goes below 1 g", () => {
    expect(stepAmountText("100", 1, null, "tr")).toBe("110");
    expect(stepAmountText("100", -1, null, "tr")).toBe("90");
    expect(stepAmountText("5", -1, null, "tr")).toBe("1");
    expect(stepAmountText("1", -1, null, "tr")).toBe("1");
    expect(stepAmountText("9995", 1, null, "tr")).toBe("10000");
  });

  it("starts from the minimum when the text is not a number", () => {
    expect(stepAmountText("", 1, 150, "tr")).toBe("0,5");
    expect(stepAmountText("abc", 1, null, "tr")).toBe("1");
  });

  it("stops at the portion maximum", () => {
    expect(stepAmountText("66,5", 1, 150, "tr")).toBe("66,5");
  });
});

describe("defaultServing", () => {
  const base: FoodView = {
    ref: { kind: "dish", id: "x" },
    name: "X",
    nameTr: "X",
    per100g: { kcal: 61.1, protein: null, carbs: null, fat: null },
    portions: [{ id: "kepce", nameTr: "1 kepçe", nameEn: "1 ladle", grams: 150 }],
    brand: null,
    category: "corba",
    isCustom: false,
  };

  it("uses the first portion", () => {
    expect(defaultServing(base, "tr")).toEqual({ label: "1 kepçe", kcal: (61.1 * 150) / 100 });
    expect(defaultServing(base, "en").label).toBe("1 ladle");
  });

  it("falls back to 100 g and keeps missing kcal null", () => {
    const none = { ...base, portions: [], per100g: { kcal: null, protein: null, carbs: null, fat: null } };
    expect(defaultServing(none, "tr")).toEqual({ label: "100 g", kcal: null });
  });
});
