import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { addWater, getWater, listEntriesByDate, useDb } from "../../db";
import { addDays, isValidLocalDate, nutrientsForGrams, sumNutrients, todayInIstanbul } from "../../domain";
import { formatDate, formatWeekday, useI18n } from "../../i18n";
import { useAppState } from "../../state/AppState";
import type { DiaryEntry, LocalDate } from "../../types";
import { ErrorState, IconButton, Loading, Screen, typography } from "../../ui";
import { CalorieCard } from "./CalorieCard";
import { dayTitleKind } from "./dayTitle";
import { MealsCard } from "./MealsCard";
import { WaterCard } from "./WaterCard";

type DayData = { entries: DiaryEntry[]; waterMl: number };

function paramDate(value: string | string[] | undefined): LocalDate | null {
  const v = Array.isArray(value) ? value[0] : value;
  return isValidLocalDate(v) ? v : null;
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

  const total = useMemo(
    () => sumNutrients((data?.entries ?? []).map((e) => nutrientsForGrams(e.per100g, e.grams))),
    [data],
  );

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

  const today = todayInIstanbul();
  const kind = dayTitleKind(date, today);
  const title = kind === "today" ? t("common.today") : kind === "yesterday" ? t("today.yesterday") : formatWeekday(date, lang);
  const header = {
    largeTitle: title,
    subtitle: formatDate(date, lang),
    headerRight: (
      <View style={styles.arrows}>
        <IconButton
          icon="chevronLeft"
          accessibilityLabel={t("today.previousDay")}
          onPress={() => changeDate(addDays(date, -1))}
        />
        <IconButton
          icon="chevronRight"
          accessibilityLabel={t("today.nextDay")}
          disabled={date >= today}
          onPress={() => changeDate(addDays(date, 1))}
        />
      </View>
    ),
  };

  if (error) {
    return (
      <Screen edges={["top"]} {...header}>
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
      <Screen edges={["top"]} {...header}>
        <Loading label={t("common.loading")} />
      </Screen>
    );
  }

  return (
    <Screen edges={["top"]} {...header}>
      <CalorieCard total={total} targets={targets} />
      <WaterCard
        waterMl={data.waterMl}
        goalMl={settings.waterGoalMl}
        busy={waterBusy}
        error={waterError}
        canUndo={lastAdd !== null}
        onAdd={(ml) => void changeWater(ml, true)}
        onUndo={() => lastAdd && void changeWater(-lastAdd.ml, false)}
      />
      <MealsCard date={date} entries={data.entries} />
      <Text style={[typography.small, { textAlign: "center" }]}>{t("disclaimer")}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  // The 44 pt touch boxes carry ~11 pt of empty space around the 22 pt glyph; pull the row to the content edge.
  arrows: { flexDirection: "row", gap: 4, marginRight: -10 },
});
