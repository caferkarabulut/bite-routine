// Design tokens. Owned by the coordinator; feature screens read these, never hard-code colors or sizes.
import { Platform, type TextStyle, type ViewStyle } from "react-native";

/** Semantic color roles. Every palette defines all of them. */
export type Palette = {
  bg: string;
  surface: string;
  primary: string;
  primaryPressed: string;
  primarySoft: string;
  onPrimary: string;
  text: string;
  textMuted: string;
  divider: string;
  track: string;
  searchBg: string;
  border: string;
  outline: string;
  disabled: string;
  water: string;
  /** Fill color for rings and bars. */
  accent: string;
  /** Accent hue dark enough for text (>= 4.5:1 on surface). */
  accentText: string;
  danger: string;
  dangerSoft: string;
  successSoft: string;
  successText: string;
  warning: string;
  protein: string;
  carbs: string;
  fat: string;
  /** Text input background and outline. */
  inputBg: string;
  inputBorder: string;
  /** "r,g,b" used for shadows (alpha is set per shadow). */
  shadow: string;
};

export type PaletteDefinition = Palette & {
  /** Text input outline width. */
  inputBorderWidth: number;
  /**
   * The accent is only used as a fill (ring, bar) next to a value that is also shown as text, so it is exempt
   * from the 3:1 non-text contrast rule. Text in the accent hue uses `accentText`.
   */
  accentIsDecorative: boolean;
};

const shared = {
  onPrimary: "#ffffff",
  danger: "#963e36",
  dangerSoft: "#f6e3e1",
  successSoft: "#e3eadf",
  successText: "#2f5b32",
  warning: "#8a5a00",
  protein: "#2f6f9f",
  carbs: "#b7791f",
  fat: "#8b4a8f",
  inputBorderWidth: 1,
  accentIsDecorative: false,
} as const;

export const palettes = {
  komur: {
    ...shared,
    bg: "#f4f1ea",
    surface: "#fbf9f4",
    primary: "#1f1f1c",
    primaryPressed: "#000000",
    primarySoft: "#e8e2d3",
    text: "#1f1f1c",
    textMuted: "#5c584f",
    divider: "#e8e2d3",
    track: "#e8e2d3",
    searchBg: "#ebe6da",
    border: "#e2dccd",
    outline: "#c4bdad",
    disabled: "#a8a293",
    water: "#5a7f99",
    accent: "#9db39a",
    accentText: "#4a6647",
    accentIsDecorative: true,
    danger: "#8e2f2a",
    dangerSoft: "#f2e0de",
    protein: "#4e6e8e",
    carbs: "#a07a32",
    fat: "#a0604c",
    inputBg: "#ffffff",
    inputBorder: "#1f1f1c",
    inputBorderWidth: 1.5,
    shadow: "31,31,28",
  },
  sofra: {
    ...shared,
    bg: "#f6f2ea",
    surface: "#fffdf9",
    primary: "#1f4a3c",
    primaryPressed: "#163a2f",
    primarySoft: "#e3ece5",
    text: "#1d2a24",
    textMuted: "#5f6b63",
    divider: "#ebe4d7",
    track: "#efe7da",
    searchBg: "#efe9dd",
    border: "#e7dfd0",
    outline: "#c9c1b3",
    disabled: "#b9b2a5",
    water: "#3f7ea6",
    accent: "#d4691f",
    accentText: "#a64b12",
    inputBg: "#fffdf9",
    inputBorder: "#e7dfd0",
    shadow: "60,45,20",
  },
  nane: {
    ...shared,
    bg: "#f3f7f5",
    surface: "#ffffff",
    primary: "#0d6e55",
    primaryPressed: "#0a5644",
    primarySoft: "#dcefe7",
    text: "#13201b",
    textMuted: "#52615b",
    divider: "#e1e8e4",
    track: "#e4ebe7",
    searchBg: "#e8eeeb",
    border: "#d9e2de",
    outline: "#b9c6c0",
    disabled: "#a3afaa",
    water: "#2b78b8",
    accent: "#e5533a",
    accentText: "#b83a22",
    inputBg: "#ffffff",
    inputBorder: "#d9e2de",
    shadow: "15,45,35",
  },
  lacivert: {
    ...shared,
    bg: "#f4f5f9",
    surface: "#ffffff",
    primary: "#22325c",
    primaryPressed: "#172448",
    primarySoft: "#e2e7f3",
    text: "#141a2b",
    textMuted: "#555e73",
    divider: "#e2e5ee",
    track: "#e6e9f0",
    searchBg: "#eaedf3",
    border: "#dce0ea",
    outline: "#c0c6d3",
    disabled: "#a5acbb",
    water: "#2a7fbd",
    accent: "#c27a00",
    accentText: "#8a5600",
    inputBg: "#ffffff",
    inputBorder: "#dce0ea",
    shadow: "20,30,60",
  },
  domates: {
    ...shared,
    // Primary is red here, so errors use a deeper, browner red to stay distinguishable.
    danger: "#8c2a1c",
    bg: "#fbf6f2",
    surface: "#ffffff",
    primary: "#b2361f",
    primaryPressed: "#932b18",
    primarySoft: "#f6e1da",
    text: "#2a1c18",
    textMuted: "#6a5a54",
    divider: "#efe4de",
    track: "#f1e7e1",
    searchBg: "#f3ebe6",
    border: "#eaddd6",
    outline: "#cdbdb5",
    disabled: "#b5a59e",
    water: "#3577ad",
    accent: "#2b8250",
    accentText: "#1d6a3e",
    inputBg: "#ffffff",
    inputBorder: "#eaddd6",
    shadow: "70,30,20",
  },
  grafit: {
    ...shared,
    bg: "#f4f4f2",
    surface: "#ffffff",
    primary: "#1d1e21",
    primaryPressed: "#000000",
    primarySoft: "#e8e8e4",
    text: "#151617",
    textMuted: "#5a5c62",
    divider: "#e5e5e1",
    track: "#e8e8e4",
    searchBg: "#ecece9",
    border: "#dfdfdb",
    outline: "#c2c2bd",
    disabled: "#a7a7a2",
    water: "#2f74c0",
    accent: "#5a9a1b",
    accentText: "#467a12",
    inputBg: "#ffffff",
    inputBorder: "#dfdfdb",
    shadow: "20,20,20",
  },
} as const satisfies Record<string, PaletteDefinition>;

export type PaletteName = keyof typeof palettes;

/** The one switch for the app's palette. */
export const ACTIVE_PALETTE: PaletteName = "komur";

/** Semantic colors of the active palette. */
export const palette: PaletteDefinition = palettes[ACTIVE_PALETTE];

/**
 * Legacy color keys, mapped from the active palette so screens written before the design pass keep working.
 * New code may use either these or `palette`.
 */
export const colors = {
  background: palette.bg,
  surface: palette.surface,
  primary: palette.primary,
  primarySoft: palette.primarySoft,
  text: palette.text,
  textMuted: palette.textMuted,
  border: palette.border,
  danger: palette.danger,
  dangerSoft: palette.dangerSoft,
  warning: palette.warning,
  protein: palette.protein,
  carbs: palette.carbs,
  fat: palette.fat,
  water: palette.water,
  // New roles, also reachable through `colors`.
  primaryPressed: palette.primaryPressed,
  onPrimary: palette.onPrimary,
  divider: palette.divider,
  track: palette.track,
  searchBg: palette.searchBg,
  outline: palette.outline,
  disabled: palette.disabled,
  accent: palette.accent,
  accentText: palette.accentText,
  successSoft: palette.successSoft,
  successText: palette.successText,
  inputBg: palette.inputBg,
  inputBorder: palette.inputBorder,
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

/** Corner radii: cards xl, inner blocks / search / inputs md–lg, buttons md. */
export const radius = { sm: 12, md: 16, lg: 20, xl: 24, pill: 999 } as const;

/**
 * Nunito (SIL OFL 1.1), embedded at build time by the expo-font config plugin (app.json), one static file per
 * weight. Each weight is addressed by its own family name so no platform has to pick (or fake) a weight from
 * `fontWeight`: iOS uses the PostScript name, Android the file name.
 */
export const fonts = {
  regular: Platform.select({ ios: "Nunito-Regular", default: "Nunito_400Regular" }),
  semibold: Platform.select({ ios: "Nunito-SemiBold", default: "Nunito_600SemiBold" }),
  bold: Platform.select({ ios: "Nunito-Bold", default: "Nunito_700Bold" }),
  extrabold: Platform.select({ ios: "Nunito-ExtraBold", default: "Nunito_800ExtraBold" }),
} as const;

/** Tabular figures so numbers do not jump while they change. Spread into any numeric text style. */
export const tabularNums: TextStyle = { fontVariant: ["tabular-nums"] };

/**
 * Type scale. Headings 800, sections/labels 700, body 400 (600 for emphasis). Legacy keys (title, heading,
 * body, label, muted, small) keep their old sizes.
 */
export const typography = {
  largeTitle: { fontFamily: fonts.extrabold, fontSize: 34, lineHeight: 41, color: palette.text },
  title: { fontFamily: fonts.extrabold, fontSize: 28, lineHeight: 34, color: palette.text },
  heading: { fontFamily: fonts.extrabold, fontSize: 20, lineHeight: 25, color: palette.text },
  section: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 22, color: palette.text },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, color: palette.text },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 24, color: palette.text },
  callout: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 20, color: palette.text },
  footnote: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: palette.textMuted },
  caption: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 13 },
  label: { fontFamily: fonts.bold, fontSize: 14, color: palette.text },
  muted: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: palette.textMuted },
  small: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: palette.textMuted },
  number: { fontVariant: ["tabular-nums"] as TextStyle["fontVariant"] },
};

const rgba = (alpha: number) => `rgba(${palette.shadow}, ${alpha})`;

/**
 * Shadows use the cross-platform `boxShadow` style (React Native New Architecture; outset shadows on
 * Android 9+). RN 0.88 runs only on the New Architecture, so no iOS shadow* / Android elevation pair is needed.
 */
export const shadow = {
  card: { boxShadow: `0 1px 2px ${rgba(0.06)}, 0 6px 18px ${rgba(0.06)}` },
  raised: { boxShadow: `0 1px 2px ${rgba(0.08)}` },
  segment: { boxShadow: `0 1px 3px ${rgba(0.12)}` },
} satisfies Record<string, ViewStyle>;

/**
 * Minimum touch target: 44 pt on iOS (Human Interface Guidelines), 48 dp on Android (Material accessibility
 * guidance). Each platform gets its own guideline value instead of one compromise.
 */
export const TOUCH: number = Platform.OS === "android" ? 48 : 44;
