import { portionToPer100g } from "../src/features/catalog/nutritionBasis";
import { formatFoodAmount, recentFoodViews, viewOfCustomFood } from "../src/features/catalog/foodView";
import type { CustomFood } from "../src/types";

const values = { kcal: 190, protein: 4.4, carbs: 23.2, fat: 8 };
const food: CustomFood = { id: "custom-drink", nameTr: "Drink", brand: "Brand", kind: "drink", per100g: values, portions: [], createdAt: "", updatedAt: "" };

it("converts a 40 g label portion to per 100 g without rounding", () => {
  expect(portionToPer100g(values, 40)).toEqual({ kcal: 475, protein: 11, carbs: 58, fat: 20 });
});
it("uses the same conversion for ml, preserves zeros and unknown historical values", () => {
  expect(portionToPer100g({ kcal: 100, protein: 0, carbs: null, fat: 2 }, 250)).toEqual({ kcal: 40, protein: 0, carbs: null, fat: 0.8 });
});
it.each([0, -1, NaN, Infinity, 10001])("rejects invalid portion size %s", (grams) => {
  expect(() => portionToPer100g(values, grams)).toThrow(RangeError);
});
it("formats drink amounts in ml without changing nutrients", () => {
  const view = viewOfCustomFood(food);
  expect(view.brand).toBe("Brand");
  expect(formatFoodAmount(view, 40.5, "tr")).toBe("40,5 ml");
  expect(formatFoodAmount(viewOfCustomFood({ ...food, kind: "food" }), 40.5, "en")).toBe("40.5 g");
});
it("skips missing refs before limiting the current foods to eight", () => {
  const foods = Array.from({ length: 10 }, (_, i) => ({ ...food, id: `custom-${i}` }));
  const refs = [{ kind: "dish" as const, id: "removed" }, { kind: "custom" as const, id: "custom-deleted" }, ...foods.map((f) => ({ kind: "custom" as const, id: f.id }))];
  expect(recentFoodViews(refs, foods, "tr", () => undefined).map((f) => f.ref.id)).toEqual(foods.slice(0, 8).map((f) => f.id));
});
