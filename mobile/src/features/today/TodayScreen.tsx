import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { addWater, getWater, listEntriesByDate, useDb } from "../../db";
import { isValidLocalDate, nutrientsForGrams, sumNutrients, todayInIstanbul } from "../../domain";
import { formatNumber, useI18n } from "../../i18n";
import { useAppState } from "../../state/AppState";
import { MEAL_SLOTS, type DiaryEntry, type Language, type LocalDate, type Nutrients } from "../../types";
import {
  Button,
  Card,
  colors,
  DayNavigator,
  Divider,
  EmptyState,
  ErrorState,
  ListRow,
  Loading,
  ProgressBar,
  Screen,
  SectionTitle,
  spacing,
  typography,
} from "../../ui";

type DayData = { entries: DiaryEntry[]; waterMl: number };

function entryNutrients(entry: DiaryEntry): Nutrients {
  return nutrientsForGrams(entry.per100g, entry.grams);
}

function paramDate(value: string | string[] | undefined): LocalDate | null {
  const v = Array.isArray(value) ? value[0] : value;
  return isValidLocalDate(v) ? v : null;
}

function amountText(e: DiaryEntry, lang: Language): string {
  if (e.portion) {
    const q = e.portion.quantity;
    return `${formatNumber(q, lang, Number.isInteger(q) ? 0 : 1)} ${e.portion.name}`;
  }
  return `${formatNumber(e.grams, lang, Number.isInteger(e.grams) ? 0 : 1)} g`;
}

export function TodayScreen() {
  const { t, lang } = useI18n();
  const db = useDb();
  const { targets, settings, dataVersion, notifyDataChanged } = useAppState();
  const params = useLocalSearchParams<{ date?: string }>();
  const paramValue = paramDate(params.date);

  const [date, setDate] = useState<LocalDate>(() => paramValue ?? todayInIstanbul());
  const [data, setData] = useState<DayData | null>(null);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [waterBusy, setWaterBusy] = useState(false);
  const [waterError, setWaterError] = useState(false);
  const [waterAdds, setWaterAdds] = useState<{ date: LocalDate; ml: number }[]>([]);

  // A new valid `date` param (e.g. from History) switches the day; adjusted during render, not in an effect.
  const [seenParam, setSeenParam] = useState(paramValue);
  if (paramValue !== seenParam) {
    setSeenParam(paramValue);
    if (paramValue) {
      setData(null);
      setDate(paramValue);
    }
  }

  useEffect(() => {
    let active = true;
    Promise.all([listEntriesByDate(db, date), getWater(db, date)]).then(
      ([entries, waterMl]) => {
        if (!active) return;
        setData({ entries, waterMl });
        setError(false);
      },
      () => {
        if (active) setError(true);
      },
    );
    return () => {
      active = false;
    };
  }, [db, date, dataVersion, reloadKey]);

  const changeDate = useCallback((next: LocalDate) => {
    setData(null);
    setDate(next);
  }, []);

  const total = useMemo(() => sumNutrients((data?.entries ?? []).map(entryNutrients)), [data]);

  const changeWater = async (delta: number, record: boolean) => {
    setWaterBusy(true);
    setWaterError(false);
    try {
      await addWater(db, date, delta);
      setWaterAdds((list) => {
        if (record) return [...list, { date, ml: delta }];
        const idx = list.map((a) => a.date).lastIndexOf(date);
        return idx < 0 ? list : list.filter((_, i) => i !== idx);
      });
      notifyDataChanged();
    } catch {
      setWaterError(true);
    } finally {
      setWaterBusy(false);
    }
  };

  const lastAdd = [...waterAdds].reverse().find((a) => a.date === date) ?? null;

  if (error) {
    return (
      <Screen>
        <DayNavigator date={date} onChange={changeDate} />
        <ErrorState
          message={t("errors.loadFailed")}
          retryLabel={t("errors.retry")}
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      </Screen>
    );
  }
  if (!data) {
    return (
      <Screen>
        <DayNavigator date={date} onChange={changeDate} />
        <Loading label={t("common.loading")} />
      </Screen>
    );
  }

  const num = (n: number) => formatNumber(n, lang, 0);
  const kcalTarget = targets?.kcal ?? null;
  const kcalEaten = total.kcal;
  const incomplete = total.kcal === null || total.protein === null || total.carbs === null || total.fat === null;

  const macroRows = [
    { key: "protein", label: t("macros.protein"), color: colors.protein, eaten: total.protein, goal: targets?.protein ?? null },
    { key: "carbs", label: t("macros.carbs"), color: colors.carbs, eaten: total.carbs, goal: targets?.carbs ?? null },
    { key: "fat", label: t("macros.fat"), color: colors.fat, eaten: total.fat, goal: targets?.fat ?? null },
  ];

  const waterGoal = settings.waterGoalMl;

  return (
    <Screen>
      <DayNavigator date={date} onChange={changeDate} />

      <Card>
        <Text style={typography.label}>{t("macros.kcal")}</Text>
        {kcalEaten === null ? (
          <Text style={typography.heading}>{t("common.noData")}</Text>
        ) : kcalTarget !== null ? (
          <>
            <Text style={typography.heading}>
              {t("features.today.eatenOfGoal", { eaten: num(kcalEaten), goal: num(kcalTarget) })}
            </Text>
            <ProgressBar
              value={kcalTarget > 0 ? kcalEaten / kcalTarget : 0}
              color={kcalEaten > kcalTarget ? colors.danger : colors.primary}
              label={t("macros.kcal")}
            />
            <Text style={[typography.body, kcalEaten > kcalTarget ? { color: colors.danger } : null]}>
              {kcalEaten > kcalTarget
                ? t("today.overKcal", { kcal: num(kcalEaten - kcalTarget) })
                : t("today.remainingKcal", { kcal: num(kcalTarget - kcalEaten) })}
            </Text>
          </>
        ) : (
          <>
            <Text style={typography.heading}>{`${num(kcalEaten)} kcal`}</Text>
            <Text style={typography.muted}>{t("today.noTargets")}</Text>
            <Button label={t("today.setUpProfile")} variant="secondary" onPress={() => router.push("/profile")} />
          </>
        )}

        <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
          {macroRows.map((m) => (
            <View key={m.key} style={{ gap: spacing.xs }}>
              <View style={styles.between}>
                <Text style={typography.label}>{m.label}</Text>
                <Text style={typography.muted}>
                  {m.eaten === null
                    ? t("common.noData")
                    : m.goal === null
                      ? t("features.today.macroEaten", { eaten: num(m.eaten) })
                      : t("features.today.macroOfGoal", { eaten: num(m.eaten), goal: num(m.goal) })}
                </Text>
              </View>
              {m.goal !== null && m.eaten !== null ? (
                <ProgressBar value={m.goal > 0 ? m.eaten / m.goal : 0} color={m.color} label={m.label} />
              ) : null}
            </View>
          ))}
        </View>
        {incomplete ? <Text style={typography.small}>{t("features.today.incompleteData")}</Text> : null}
      </Card>

      {data.entries.length === 0 ? <EmptyState message={t("today.emptyDay")} /> : null}

      {MEAL_SLOTS.map((slot) => {
        const items = data.entries.filter((e) => e.mealSlot === slot);
        const mealKcal = sumNutrients(items.map(entryNutrients)).kcal;
        const mealName = t(`meals.${slot}`);
        return (
          <Card key={slot}>
            <View style={styles.between}>
              <SectionTitle>{mealName}</SectionTitle>
              <Text style={typography.label}>
                {mealKcal === null ? t("common.noData") : t("today.mealTotal", { kcal: num(mealKcal) })}
              </Text>
            </View>
            {items.length === 0 ? <Text style={typography.muted}>{t("today.emptyMeal")}</Text> : null}
            {items.map((e, i) => {
              const kcal = entryNutrients(e).kcal;
              return (
                <View key={e.id}>
                  {i > 0 ? <Divider /> : null}
                  <ListRow
                    title={e.foodName}
                    subtitle={amountText(e, lang)}
                    right={kcal === null ? t("common.noData") : t("today.mealTotal", { kcal: num(kcal) })}
                    accessibilityHint={t("features.today.openEntry")}
                    onPress={() => router.push({ pathname: "/entry/[id]", params: { id: e.id } })}
                  />
                </View>
              );
            })}
            <Button
              testID={`add-${slot}`}
              label={`+ ${t("common.add")}`}
              variant="ghost"
              accessibilityHint={t("features.today.addToMeal", { meal: mealName })}
              onPress={() => router.push({ pathname: "/catalog", params: { date, meal: slot } })}
            />
          </Card>
        );
      })}

      <Card>
        <View style={styles.between}>
          <SectionTitle>{t("today.water")}</SectionTitle>
          <Text style={typography.label}>
            {t("today.waterProgress", { ml: num(data.waterMl), goal: num(waterGoal) })}
          </Text>
        </View>
        <ProgressBar value={waterGoal > 0 ? data.waterMl / waterGoal : 0} color={colors.water} label={t("today.water")} />
        <View style={styles.waterButtons}>
          <View style={{ flex: 1 }}>
            <Button
              label={t("today.addWater", { ml: 200 })}
              variant="secondary"
              disabled={waterBusy}
              onPress={() => void changeWater(200, true)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={t("today.addWater", { ml: 500 })}
              variant="secondary"
              disabled={waterBusy}
              onPress={() => void changeWater(500, true)}
            />
          </View>
        </View>
        <Button
          label={t("today.removeWater")}
          variant="ghost"
          disabled={waterBusy || !lastAdd}
          onPress={() => lastAdd && void changeWater(-lastAdd.ml, false)}
        />
        {waterError ? (
          <Text accessibilityRole="alert" style={[typography.muted, { color: colors.danger }]}>
            {t("errors.saveFailed")}
          </Text>
        ) : null}
      </Card>

      <Text style={[typography.small, { textAlign: "center" }]}>{t("disclaimer")}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  waterButtons: { flexDirection: "row", gap: spacing.sm },
});
