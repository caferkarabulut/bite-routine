import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { addWater, getWater, listEntriesByDate, useDb } from "../../db";
import { addDays, isValidLocalDate, nutrientsForGrams, sumNutrients, todayInIstanbul } from "../../domain";
import { formatDate, formatWeekday, useI18n } from "../../i18n";
import { useAppState } from "../../state/AppState";
import type { DiaryEntry, LocalDate } from "../../types";
import { ErrorState, IconButton, Loading, Screen, colors, typography } from "../../ui";
import { CalorieCard } from "./CalorieCard";
import { canGoForward, dayTitleKind } from "./dayTitle";
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
  const title =
    kind === "today"
      ? t("common.today")
      : kind === "yesterday"
        ? t("today.yesterday")
        : kind === "tomorrow"
          ? t("today.tomorrow")
          : formatWeekday(date, lang);
  const header = {
    centerHeader: true,
    largeTitle: title,
    subtitle: formatDate(date, lang),
    headerLeft: (
      <IconButton
        icon="chevronLeft"
        accessibilityLabel={t("today.previousDay")}
        onPress={() => changeDate(addDays(date, -1))}
      />
    ),
    headerRight: (
      <IconButton
        icon="chevronRight"
        accessibilityLabel={t("today.nextDay")}
        disabled={!canGoForward(date, today)}
        onPress={() => changeDate(addDays(date, 1))}
      />
    ),
    headerBelow:
      date !== today ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("today.goToToday")}
          hitSlop={8}
          onPress={() => changeDate(today)}
          style={styles.backToday}
        >
          <Text style={[typography.label, { color: colors.primary }]}>{t("today.goToToday")}</Text>
        </Pressable>
      ) : null,
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
  backToday: { minHeight: 32, justifyContent: "center", paddingHorizontal: 8 },
});
