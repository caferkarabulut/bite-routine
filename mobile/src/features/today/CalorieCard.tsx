// Calorie summary card of the Today screen: ring with the remaining kcal, eaten/goal values, macro bars.
import { router } from "expo-router";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { formatNumber, useI18n } from "../../i18n";
import type { Nutrients, Targets } from "../../types";
import { Button, Card, colors, fonts, ProgressRing, spacing, typography } from "../../ui";

/** From this font scale on, the ring and the macro cells stack instead of sharing a row. */
const STACK_FROM_FONT_SCALE = 1.4;

export function CalorieCard({ total, targets }: { total: Nutrients; targets: Targets | null }) {
  const { t, lang } = useI18n();
  const { fontScale } = useWindowDimensions();
  const stacked = fontScale >= STACK_FROM_FONT_SCALE;
  const num = (n: number) => formatNumber(n, lang, 0);

  const eaten = total.kcal;
  const goal = targets?.kcal ?? null;
  const over = eaten !== null && goal !== null && eaten > goal;
  const incomplete = total.kcal === null || total.protein === null || total.carbs === null || total.fat === null;
  const noData = t("common.noData");

  const macros = [
    { key: "protein", label: t("macros.protein"), eaten: total.protein, goal: targets?.protein ?? null },
    { key: "carbs", label: t("macros.carbs"), eaten: total.carbs, goal: targets?.carbs ?? null },
    { key: "fat", label: t("macros.fat"), eaten: total.fat, goal: targets?.fat ?? null },
  ];

  const kcalValue = (value: number | null) =>
    value === null ? (
      <Text style={styles.sideValue}>{noData}</Text>
    ) : (
      <Text style={[styles.sideValue, typography.number]}>
        {num(value)}
        <Text style={styles.sideUnit}> kcal</Text>
      </Text>
    );

  let summary;
  if (goal !== null) {
    const centerText = eaten === null ? null : over ? num(eaten - goal) : num(goal - eaten);
    const sentence =
      eaten === null
        ? noData
        : over
          ? t("today.overKcal", { kcal: num(eaten - goal) })
          : t("today.remainingKcal", { kcal: num(goal - eaten) });
    summary = (
      <View style={[styles.summary, stacked ? styles.summaryStacked : null]}>
        <ProgressRing
          testID="today-ring"
          value={eaten === null ? 0 : over ? 1 : goal > 0 ? eaten / goal : 0}
          size={140}
          strokeWidth={12}
          color={over ? colors.danger : colors.accent}
          trackColor={colors.track}
          accessibilityLabel={sentence}
          accessibilityValueText={eaten === null ? undefined : t("features.today.eatenOfGoal", { eaten: num(eaten), goal: num(goal) })}
        >
          {centerText === null ? (
            <Text style={styles.ringLabel}>{noData}</Text>
          ) : (
            <>
              <Text maxFontSizeMultiplier={1.2} style={[styles.ringValue, typography.number, over ? { color: colors.danger } : null]}>
                {centerText}
              </Text>
              <Text maxFontSizeMultiplier={1.2} style={styles.ringLabel}>
                {over ? t("today.kcalOver") : t("today.kcalLeft")}
              </Text>
            </>
          )}
        </ProgressRing>
        <View style={styles.sideColumn}>
          <View>
            <Text style={typography.footnote}>{t("today.eaten")}</Text>
            {kcalValue(eaten)}
          </View>
          <View>
            <Text style={typography.footnote}>{t("today.goal")}</Text>
            {kcalValue(goal)}
          </View>
        </View>
      </View>
    );
  } else {
    summary = (
      <View style={{ gap: spacing.md }}>
        <View>
          <Text style={typography.footnote}>{t("today.eaten")}</Text>
          {kcalValue(eaten)}
        </View>
        <Text style={typography.muted}>{t("today.noTargets")}</Text>
        <Button label={t("today.setUpProfile")} variant="secondary" onPress={() => router.push("/profile")} />
      </View>
    );
  }

  return (
    <Card style={styles.card}>
      {summary}
      <View style={styles.macroGrid}>
        {macros.map((m) => (
          <View key={m.key} style={[styles.macroCell, stacked ? styles.macroCellStacked : null]}>
            <Text style={typography.footnote}>{m.label}</Text>
            {m.eaten === null ? (
              <Text style={styles.macroValue}>{noData}</Text>
            ) : (
              <Text style={[styles.macroValue, typography.number]}>
                {num(m.eaten)}
                <Text style={styles.macroTarget}>{m.goal === null ? " g" : ` / ${num(m.goal)} g`}</Text>
              </Text>
            )}
            {m.goal !== null && m.eaten !== null ? (
              <View style={styles.macroTrack}>
                <View style={[styles.macroFill, { width: `${Math.max(0, Math.min(1, m.goal > 0 ? m.eaten / m.goal : 0)) * 100}%` }]} />
              </View>
            ) : null}
          </View>
        ))}
      </View>
      {incomplete ? <Text style={typography.small}>{t("features.today.incompleteData")}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { paddingTop: 18, paddingHorizontal: 18, paddingBottom: 16, gap: 16 },
  summary: { flexDirection: "row", alignItems: "center", gap: 20 },
  summaryStacked: { flexDirection: "column", alignItems: "flex-start", gap: spacing.lg },
  sideColumn: { flex: 1, gap: spacing.md },
  ringValue: { fontFamily: fonts.extrabold, fontSize: 32, lineHeight: 36, color: colors.text },
  ringLabel: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.textMuted, textAlign: "center" },
  sideValue: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 25, color: colors.text },
  sideUnit: { fontFamily: fonts.regular, fontSize: 15, color: colors.textMuted },
  macroGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  macroCell: { flex: 1, minWidth: 0, gap: spacing.xs },
  macroCellStacked: { flex: 0, width: "100%" },
  macroValue: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 20, color: colors.text },
  macroTarget: { fontFamily: fonts.regular, color: colors.textMuted },
  macroTrack: { height: 4, borderRadius: 2, backgroundColor: colors.track, overflow: "hidden" },
  macroFill: { height: 4, borderRadius: 2, backgroundColor: colors.primary },
});
