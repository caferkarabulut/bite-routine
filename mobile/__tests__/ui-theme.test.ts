import { ACTIVE_PALETTE, colors, contrastRatio, palette, palettes, relativeLuminance } from "../src/ui";

describe("contrastRatio", () => {
  it("matches the WCAG reference values", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
    expect(contrastRatio("#777777", "#ffffff")).toBeCloseTo(4.48, 2);
    expect(contrastRatio("#fff", "#000")).toBeCloseTo(21, 5);
  });

  it("rejects non-hex input", () => {
    expect(() => relativeLuminance("red")).toThrow();
  });
});

describe.each(Object.entries(palettes))("palette %s", (_name, p) => {
  it.each([
    ["text", "bg"],
    ["text", "surface"],
    ["textMuted", "bg"],
    ["textMuted", "surface"],
    ["textMuted", "searchBg"],
    ["onPrimary", "primary"],
    ["onPrimary", "primaryPressed"],
    ["accentText", "surface"],
    ["danger", "surface"],
    ["successText", "successSoft"],
    ["text", "inputBg"],
  ] as const)("%s on %s is at least 4.5:1", (fg, bg) => {
    expect(contrastRatio(p[fg], p[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it.each([["water"], ["protein"], ["carbs"], ["fat"], ["primary"]] as const)("%s on surface is at least 3:1", (key) => {
    expect(contrastRatio(p[key], p.surface)).toBeGreaterThanOrEqual(3);
  });

  it("accent on surface is at least 3:1 unless the palette marks it decorative", () => {
    if (p.accentIsDecorative) {
      // Decorative fills only; text in that hue must use accentText.
      expect(contrastRatio(p.accentText, p.surface)).toBeGreaterThanOrEqual(4.5);
    } else {
      expect(contrastRatio(p.accent, p.surface)).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("active palette", () => {
  it("is komur and drives the legacy color keys", () => {
    expect(ACTIVE_PALETTE).toBe("komur");
    expect(colors.background).toBe(palette.bg);
    expect(colors.primary).toBe(palette.primary);
    expect(colors.textMuted).toBe(palette.textMuted);
    for (const key of ["background", "surface", "primary", "primarySoft", "text", "textMuted", "border", "danger", "dangerSoft", "warning", "protein", "carbs", "fat", "water"] as const) {
      expect(typeof colors[key]).toBe("string");
    }
  });

  it("only komur is allowed a decorative accent", () => {
    const decorative = Object.entries(palettes)
      .filter(([, p]) => p.accentIsDecorative)
      .map(([n]) => n);
    expect(decorative).toEqual(["komur"]);
  });
});
