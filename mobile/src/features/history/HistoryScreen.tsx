import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { listEntriesInRange, listWeights, useDb } from "../../db";
import { addDays, todayInIstanbul } from "../../domain";
import { formatDate, formatGrams, formatNumber, useI18n } from "../../i18n";
import { useAppState } from "../../state/AppState";
import type { DiaryEntry, WeightLog } from "../../types";
import { Card, Divider, EmptyState, ErrorState, Icon, IconButton, Loading, Screen, colors, fonts, palette, radius, spacing, typography, TOUCH } from "../../ui";
import { barFraction, formatWeekRange, summarizeWeek, weekEnd, type DaySummary } from "./aggregate";

type Loaded = { entries: DiaryEntry[]; latestWeight: WeightLog | null };

export function HistoryScreen() {
  const { t, lang } = useI18n();
  const db = useDb();
  const { targets, dataVersion } = useAppState();
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const today = todayInIstanbul();
  const end = weekEnd(today, offset);
  const start = addDays(end, -6);

  useEffect(() => {
    let active = true;
    Promise.all([listEntriesInRange(db, start, end), listWeights(db)])
      .then(([entries, weights]) => {
        if (!active) return;
        setData({ entries, latestWeight: weights.length > 0 ? weights[weights.length - 1] : null });
        setFailed(false);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [db, start, end, dataVersion, attempt]);

  const week = useMemo(() => (data ? summarizeWeek(end, data.entries) : null), [data, end]);

  const header = {
    edges: ["top"] as ("top" | "bottom")[],
    largeTitle: t("tabs.history"),
    centerHeader: true,
    subtitle: offset === 0
      ? t("features.history.currentWeekRange", { range: formatWeekRange(start, end, lang) })
      : formatWeekRange(start, end, lang),
    headerLeft: <IconButton icon="chevronLeft" accessibilityLabel={t("features.history.previousWeek")} onPress={() => setOffset((o) => o + 1)} />,
    headerRight: offset > 0
      ? <IconButton icon="chevronRight" accessibilityLabel={t("features.history.nextWeek")} onPress={() => setOffset((o) => Math.max(0, o - 1))} />
      : undefined,
  };

  if (failed) {
    return (
      <Screen {...header}>
        <ErrorState
          message={t("features.history.loadFailed")}
          retryLabel={t("errors.retry")}
          onRetry={() => setAttempt((a) => a + 1)}
        />
      </Screen>
    );
  }
  if (!data || !week) {
    return (
      <Screen {...header}>
        <Loading label={t("features.history.loading")} />
      </Screen>
    );
  }

  return (
    <Screen {...header}>
      <Card>
        <View style={styles.summaryRow}>
          <Text accessibilityRole="header" style={typography.section}>{t("features.history.weekSummary")}</Text>
          <Text style={typography.footnote}>{t("features.history.loggedDays", { count: week.loggedDays })}</Text>
        </View>
        {week.averageKcal === null ? <Text style={typography.muted}>{t("features.history.averageNone")}</Text> : (
          <View accessible accessibilityLabel={t("features.history.averageKcal", { kcal: formatNumber(week.averageKcal, lang, 0) })} style={styles.summaryRow}>
            <Text style={styles.average}>{t("features.history.kcalOnly", { kcal: formatNumber(week.averageKcal, lang, 0) })}</Text>
            <Text style={typography.footnote}>{t("features.history.dailyAverage")}</Text>
          </View>
        )}
      </Card>
      {week.loggedDays === 0 ? <EmptyState message={t("history.noRecordsWeek")} /> : null}
      <Card padded={false} style={styles.daysCard}>
        {week.days.map((day, i) => (
          <View key={day.date}>
            {i > 0 ? <Divider /> : null}
            <DayCard day={day} target={targets?.kcal ?? null} />
          </View>
        ))}
      </Card>
      <Card padded={false}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("features.history.weightCardTitle")}
          accessibilityHint={t("features.history.weightCardHint")}
          onPress={() => router.push("/weight")}
          style={styles.weightCard}
        >
          <View style={styles.weightText}>
            <Text style={typography.section}>{t("features.history.weightCardTitle")}</Text>
            <Text style={typography.footnote}>
              {data.latestWeight
                ? t("features.history.weightCardLatest", {
                    kg: formatNumber(data.latestWeight.kg, lang, 1),
                    date: formatDate(data.latestWeight.date, lang),
                  })
                : t("features.history.weightCardEmpty")}
            </Text>
          </View>
          <Icon name="chevronRight" size={16} />
        </Pressable>
      </Card>
    </Screen>
  );
}

function DayCard({ day, target }: { day: DaySummary; target: number | null }) {
  const { t, lang } = useI18n();
  const dateText = formatDate(day.date, lang);
  const { kcal, protein, carbs, fat } = day.totals;

  let summary: string;
  if (day.status === "empty") summary = t("features.history.noEntries");
  else {
    const kcalText =
      kcal === null
        ? t("features.history.incomplete")
        : target !== null
          ? t("features.history.kcalOfTarget", { kcal: formatNumber(kcal, lang, 0), target: formatNumber(target, lang, 0) })
          : t("features.history.kcalOnly", { kcal: formatNumber(kcal, lang, 0) });
    summary = day.status === "incomplete" ? `${kcalText}. ${t("features.history.incompleteReason")}` : kcalText;
  }
  const fraction = barFraction(kcal, target);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("features.history.dayLabel", { date: dateText, summary })}
      accessibilityHint={t("history.openDay")}
      onPress={() => router.push({ pathname: "/", params: { date: day.date } })}
      style={({ pressed }) => [styles.dayCard, pressed ? { backgroundColor: colors.primarySoft } : null]}
    >
      <View style={styles.dayHeading}>
        <Text style={styles.dayDate}>{dateText}</Text>
        <View style={styles.dayValue}>
          <Text style={[typography.small, { flexShrink: 1 }, day.status === "incomplete" ? { color: colors.warning } : null]}>
            {day.status === "empty" ? t("features.history.noEntries") : kcal === null ? t("features.history.incomplete") : target !== null
              ? t("features.history.kcalOfTarget", { kcal: formatNumber(kcal, lang, 0), target: formatNumber(target, lang, 0) })
              : t("features.history.kcalOnly", { kcal: formatNumber(kcal, lang, 0) })}
          </Text>
          <Icon name="chevronRight" size={16} />
        </View>
      </View>
      {day.status !== "empty" ? (
        <>
          {kcal !== null && target !== null ? (
            <View style={styles.track}>
              <View
                testID={`bar-${day.date}`}
                style={[styles.fill, { width: `${fraction * 100}%`, backgroundColor: kcal > target ? colors.warning : palette.accent }]}
              />
            </View>
          ) : null}
          <Text style={typography.small}>
            {t("features.history.macroLine", {
              protein: formatGrams(protein, lang),
              carbs: formatGrams(carbs, lang),
              fat: formatGrams(fat, lang),
            })}
          </Text>
          {day.status === "incomplete" ? (
            <Text style={[typography.small, { color: colors.warning }]}>{t("features.history.incompleteReason")}</Text>
          ) : null}
        </>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  summaryRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: spacing.sm },
  average: { fontFamily: fonts.extrabold, fontSize: 30, lineHeight: 36, color: palette.accentText, fontVariant: ["tabular-nums"] },
  daysCard: { gap: 0, paddingHorizontal: spacing.lg },
  dayCard: { minHeight: TOUCH, paddingVertical: spacing.sm, gap: spacing.xs, justifyContent: "center" },
  dayHeading: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: spacing.xs },
  dayDate: { flexShrink: 1, ...typography.footnote, fontFamily: fonts.bold, color: colors.text },
  dayValue: { flexDirection: "row", alignItems: "center", gap: spacing.xs, flexShrink: 1 },
  track: { height: 4, borderRadius: radius.pill, backgroundColor: palette.track, overflow: "hidden" },
  fill: { height: "100%", borderRadius: radius.pill },
  weightText: { flex: 1, gap: spacing.xs },
  weightCard: { minHeight: 54, padding: spacing.lg, flexDirection: "row", alignItems: "center", gap: spacing.sm },
});
