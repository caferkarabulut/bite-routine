import { portionAmountText } from "../src/ui/inputs";

describe("portionAmountText", () => {
  it("drops the leading 1 of a portion name", () => {
    expect(portionAmountText(1.5, "1 kepçe", "tr")).toBe("1,5 kepçe");
    expect(portionAmountText(2, "1 bardak (240 ml)", "tr")).toBe("2 bardak (240 ml)");
    expect(portionAmountText(0.25, "1 porsiyon", "tr")).toBe("0,25 porsiyon");
    expect(portionAmountText(1.5, "1 cup", "en")).toBe("1.5 cup");
  });

  it("keeps the name as is for one portion", () => {
    expect(portionAmountText(1, "1 kepçe", "tr")).toBe("1 kepçe");
    expect(portionAmountText(1, "Dilim", "tr")).toBe("Dilim");
  });

  it("uses a multiplier when the name has no leading 1", () => {
    expect(portionAmountText(2, "Dilim", "tr")).toBe("2 × Dilim");
    expect(portionAmountText(2, "10 tane", "tr")).toBe("2 × 10 tane");
    expect(portionAmountText(3, "1/2 bardak", "tr")).toBe("3 × 1/2 bardak");
  });
});
