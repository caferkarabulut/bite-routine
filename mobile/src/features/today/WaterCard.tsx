// Water card of the Today screen: "Su 700 / 2.000 ml", a row of glasses, +200 and +500 buttons, undo.
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { formatNumber, useI18n } from "../../i18n";
import { Card, colors, fonts, IconButton, spacing, typography } from "../../ui";
import { glassFills } from "./water";

const GLASS_GAP = 2;
const GLASS_MAX_SIZE = 22;
const GLASS_MIN_SIZE = 14;

// Glass outline in a 24 x 24 box: top edge y = 4 (x 6..18), bottom y = 20 (x 7.5..16.5). A full glass is
// filled up to y = 9, so 11 of the 16 units; partial glasses fill proportionally.
const OUTLINE = "M6 4h12l-1.5 16h-9z";
const FILL_HEIGHT = 11;

function fillPath(fraction: number): string {
  const top = 20 - FILL_HEIGHT * fraction;
  const inset = (1.5 * (top - 4)) / 16;
  return `M${6 + inset} ${top}H${18 - inset}L16.5 20H7.5Z`;
}

/** A glass drawn as an outline; `fraction` (0..1) of it is filled with water. Decorative. */
function Glass({ fraction, size }: { fraction: number; size: number }) {
  const filled = fraction > 0;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {filled ? <Path d={fillPath(fraction)} fill={colors.water} /> : null}
      <Path d={OUTLINE} stroke={filled ? colors.water : colors.outline} strokeWidth={1.75} strokeLinejoin="round" />
    </Svg>
  );
}

export function WaterCard({
  waterMl,
  goalMl,
  busy,
  error,
  canUndo,
  onAdd,
  onUndo,
}: {
  waterMl: number;
  goalMl: number;
  busy: boolean;
  error: boolean;
  canUndo: boolean;
  onAdd: (ml: number) => void;
  onUndo: () => void;
}) {
  const { t, lang } = useI18n();
  const [width, setWidth] = useState<number | null>(null);
  const num = (n: number) => formatNumber(n, lang, 0);
  const fills = glassFills(waterMl, goalMl);
  // Shrink the glasses so that the whole row fits on one line; it wraps only when even the smallest size cannot.
  const fitted = width === null ? GLASS_MAX_SIZE : Math.floor((width - GLASS_GAP * (fills.length - 1)) / fills.length);
  const glassSize = Math.max(GLASS_MIN_SIZE, Math.min(GLASS_MAX_SIZE, fitted));

  return (
    <Card style={styles.card}>
      <View style={styles.main} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        <View style={styles.textRow}>
          <Text accessibilityRole="header" style={styles.title}>
            {t("today.water")}
          </Text>
          <Text style={[styles.progress, typography.number]}>
            {t("today.waterProgress", { ml: num(waterMl), goal: num(goalMl) })}
          </Text>
          {canUndo ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("today.removeWater")}
              accessibilityState={{ disabled: busy }}
              disabled={busy}
              hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
              onPress={onUndo}
              style={({ pressed }) => [styles.undo, { opacity: busy ? 0.45 : pressed ? 0.6 : 1 }]}
            >
              <Text style={styles.undoText}>{t("today.undo")}</Text>
            </Pressable>
          ) : null}
        </View>
        <View
          style={styles.glasses}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {fills.map((fraction, i) => (
            <Glass key={i} fraction={fraction} size={glassSize} />
          ))}
        </View>
        {error ? (
          <Text accessibilityRole="alert" style={[typography.muted, { color: colors.danger }]}>
            {t("errors.saveFailed")}
          </Text>
        ) : null}
      </View>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("today.addWater", { ml: 500 })}
          accessibilityState={{ disabled: busy }}
          disabled={busy}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          onPress={() => onAdd(500)}
          style={({ pressed }) => [styles.pill, { opacity: busy ? 0.45 : pressed ? 0.6 : 1 }]}
        >
          <Text style={styles.pillText}>+500</Text>
        </Pressable>
        <IconButton
          icon="plus"
          variant="tinted"
          accessibilityLabel={t("today.addWater", { ml: 200 })}
          disabled={busy}
          onPress={() => onAdd(200)}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 12, paddingLeft: 18, paddingRight: 10 },
  main: { flex: 1, gap: 6 },
  textRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 6 },
  title: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 20, color: colors.text },
  progress: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 20, color: colors.textMuted },
  undo: { marginLeft: spacing.sm },
  undoText: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 20, color: colors.primary, textDecorationLine: "underline" },
  glasses: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: GLASS_GAP },
  actions: { flexDirection: "row", alignItems: "center", gap: 4 },
  pill: {
    minWidth: 52,
    height: 32,
    paddingHorizontal: spacing.sm,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  pillText: { fontFamily: fonts.bold, fontSize: 15, color: colors.primary },
});
