import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { listEntriesInRange, listWeights, useDb } from "../../db";
import { addDays, todayInIstanbul } from "../../domain";
import { formatDate, formatGrams, formatNumber, useI18n } from "../../i18n";
import { useAppState } from "../../state/AppState";
import type { DiaryEntry, WeightLog } from "../../types";
import { Card, EmptyState, ErrorState, Loading, Screen, SectionTitle, colors, radius, spacing, typography, TOUCH } from "../../ui";
import { barFraction, summarizeWeek, weekEnd, type DaySummary } from "./aggregate";

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

  const nav = (
    <View style={styles.navRow}>
      <ArrowButton label={t("features.history.previousWeek")} symbol="‹" onPress={() => setOffset((o) => o + 1)} />
      <View style={styles.rangeLabel} accessible accessibilityLabel={rangeText()}>
        <Text style={typography.label}>{rangeText()}</Text>
        {offset === 0 ? <Text style={typography.small}>{t("features.history.thisWeek")}</Text> : null}
      </View>
      <ArrowButton
        label={t("features.history.nextWeek")}
        symbol="›"
        disabled={offset === 0}
        onPress={() => setOffset((o) => Math.max(0, o - 1))}
      />
    </View>
  );

  function rangeText(): string {
    return t("features.history.rangeLabel", { start: formatDate(start, lang), end: formatDate(end, lang) });
  }

  if (failed) {
    return (
      <Screen>
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
      <Screen>
        <Loading label={t("features.history.loading")} />
      </Screen>
    );
  }

  return (
    <Screen>
      {nav}
      <Card>
        <SectionTitle>{t("features.history.weekSummary")}</SectionTitle>
        <Text style={typography.body}>
          {week.averageKcal === null
            ? t("features.history.averageNone")
            : t("features.history.averageKcal", { kcal: formatNumber(week.averageKcal, lang, 0) })}
        </Text>
        <Text style={typography.muted}>{t("features.history.loggedDays", { count: week.loggedDays })}</Text>
      </Card>
      {week.loggedDays === 0 ? <EmptyState message={t("history.noRecordsWeek")} /> : null}
      {week.days.map((day) => (
        <DayCard key={day.date} day={day} target={targets?.kcal ?? null} />
      ))}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("features.history.weightCardTitle")}
        accessibilityHint={t("features.history.weightCardHint")}
        onPress={() => router.push("/weight")}
        style={styles.weightCard}
      >
        <Text style={typography.heading}>{t("features.history.weightCardTitle")}</Text>
        <Text style={typography.muted}>
          {data.latestWeight
            ? t("features.history.weightCardLatest", {
                kg: formatNumber(data.latestWeight.kg, lang, 1),
                date: formatDate(data.latestWeight.date, lang),
              })
            : t("features.history.weightCardEmpty")}
        </Text>
      </Pressable>
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
      <Text style={typography.label}>{dateText}</Text>
      {day.status === "empty" ? (
        <Text style={typography.muted}>{t("features.history.noEntries")}</Text>
      ) : (
        <>
          {kcal === null ? (
            <Text style={[typography.body, { color: colors.warning }]}>{t("features.history.incomplete")}</Text>
          ) : (
            <Text style={typography.body}>
              {target !== null
                ? t("features.history.kcalOfTarget", { kcal: formatNumber(kcal, lang, 0), target: formatNumber(target, lang, 0) })
                : t("features.history.kcalOnly", { kcal: formatNumber(kcal, lang, 0) })}
            </Text>
          )}
          {kcal !== null && target !== null ? (
            <View style={styles.track}>
              <View
                testID={`bar-${day.date}`}
                style={[styles.fill, { width: `${fraction * 100}%`, backgroundColor: kcal > target ? colors.warning : colors.primary }]}
              />
            </View>
          ) : null}
          <Text style={typography.muted}>
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
      )}
    </Pressable>
  );
}

function ArrowButton({ label, symbol, onPress, disabled }: { label: string; symbol: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.arrow, disabled ? { opacity: 0.3 } : null]}
    >
      <Text style={styles.arrowText}>{symbol}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  navRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  rangeLabel: { flex: 1, alignItems: "center", minHeight: TOUCH, justifyContent: "center" },
  arrow: { width: TOUCH, height: TOUCH, alignItems: "center", justifyContent: "center" },
  arrowText: { fontSize: 28, color: colors.primary },
  dayCard: {
    minHeight: TOUCH,
    padding: spacing.lg,
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  track: { height: 8, borderRadius: radius.pill, backgroundColor: colors.border, overflow: "hidden" },
  fill: { height: "100%", borderRadius: radius.pill },
  weightCard: {
    minHeight: TOUCH,
    padding: spacing.lg,
    gap: spacing.xs,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
  },
});
