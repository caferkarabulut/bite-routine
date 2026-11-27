import { defaultMealForTime } from "../src/domain/meals";

// Hours just before and at each change, including midnight.
it.each([
  [0, "snack"],
  [4, "snack"],
  [5, "breakfast"],
  [10, "breakfast"],
  [11, "lunch"],
  [15, "lunch"],
  [16, "dinner"],
  [21, "dinner"],
  [22, "snack"],
  [23, "snack"],
] as const)("defaultMealForTime(%i) returns %s", (hour, meal) => {
  expect(defaultMealForTime(hour)).toBe(meal);
});
