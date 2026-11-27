// One card with all four meals of the day: header (name, kcal, "+"), entry rows, hairlines between meals.
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { nutrientsForGrams, sumNutrients } from "../../domain";
import { formatNumber, useI18n } from "../../i18n";
import { MEAL_SLOTS, type DiaryEntry, type LocalDate } from "../../types";
import { Card, colors, Divider, fonts, SectionHeader, spacing, typography } from "../../ui";
import { entryAmountText } from "./entryAmount";

const SIDE = 18;

export function MealsCard({ date, entries }: { date: LocalDate; entries: DiaryEntry[] }) {
  const { t, lang } = useI18n();
  const num = (n: number) => formatNumber(n, lang, 0);
  const kcalOf = (e: DiaryEntry) => nutrientsForGrams(e.per100g, e.grams).kcal;

  return (
    <Card padded={false} style={{ gap: 0 }}>
      {MEAL_SLOTS.map((slot, index) => {
        const items = entries.filter((e) => e.mealSlot === slot);
        const mealKcal = sumNutrients(items.map((e) => nutrientsForGrams(e.per100g, e.grams))).kcal;
        const mealName = t(`meals.${slot}`);
        return (
          <View key={slot}>
            {index > 0 ? <Divider inset={SIDE} /> : null}
            <SectionHeader
              title={mealName}
              detail={items.length === 0 ? undefined : mealKcal === null ? t("common.noData") : t("today.mealTotal", { kcal: num(mealKcal) })}
              style={styles.header}
              action={{
                accessibilityLabel: t("features.today.addToMeal", { meal: mealName }),
                testID: `add-${slot}`,
                onPress: () => router.push({ pathname: "/catalog", params: { date, meal: slot } }),
              }}
            />
            {items.length === 0 ? <Text style={styles.empty}>{t("today.emptyMeal")}</Text> : null}
            {items.map((e) => {
              const kcal = kcalOf(e);
              const amount = entryAmountText(e, lang);
              const kcalText = kcal === null ? t("common.noData") : t("today.mealTotal", { kcal: num(kcal) });
              return (
                <Pressable
                  key={e.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${e.foodName}, ${amount}, ${kcalText}`}
                  accessibilityHint={t("features.today.openEntry")}
                  onPress={() => router.push({ pathname: "/entry/[id]", params: { id: e.id } })}
                  style={({ pressed }) => [styles.entry, pressed ? { opacity: 0.6 } : null]}
                >
                  <View style={styles.entryText}>
                    <Text style={styles.entryName}>{e.foodName}</Text>
                    <Text style={typography.footnote}>{amount}</Text>
                  </View>
                  <Text style={styles.entryKcal}>{kcalText}</Text>
                </Pressable>
              );
            })}
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 6, paddingLeft: SIDE, paddingRight: 8 },
  empty: { ...typography.callout, color: colors.textMuted, paddingHorizontal: SIDE, paddingBottom: 14 },
  entry: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingTop: 4,
    paddingBottom: 10,
    paddingHorizontal: SIDE,
  },
  entryText: { flex: 1 },
  entryName: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 21, color: colors.text },
  entryKcal: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 20, color: colors.text, fontVariant: ["tabular-nums"] },
});
