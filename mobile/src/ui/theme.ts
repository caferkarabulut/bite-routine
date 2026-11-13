// Design tokens. Owned by the coordinator; the visual design pass (Faz 3) refines these values.
export const colors = {
  background: "#f7f8f4",
  surface: "#ffffff",
  primary: "#173f34",
  primarySoft: "#e5f3e9",
  text: "#18312c",
  textMuted: "#5b7166",
  border: "#d9e4dc",
  danger: "#963e36",
  dangerSoft: "#f6e3e1",
  warning: "#8a5a00",
  protein: "#2f6f9f",
  carbs: "#b7791f",
  fat: "#8b4a8f",
  water: "#2b7bb9",
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

export const typography = {
  title: { fontSize: 28, fontWeight: "700" as const, color: colors.text },
  heading: { fontSize: 20, fontWeight: "600" as const, color: colors.text },
  body: { fontSize: 16, lineHeight: 24, color: colors.text },
  label: { fontSize: 14, fontWeight: "600" as const, color: colors.text },
  muted: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
  small: { fontSize: 12, lineHeight: 16, color: colors.textMuted },
};

/** Minimum touch target in points. */
export const TOUCH = 48;
