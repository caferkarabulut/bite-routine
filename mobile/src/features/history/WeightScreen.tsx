import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Keyboard, Pressable, StyleSheet, Text, View } from "react-native";

import { addWeight, deleteWeight, listWeights, useDb } from "../../db";
import { parseAmount, todayInIstanbul } from "../../domain";
import { formatDate, formatNumber, useI18n } from "../../i18n";
import { useAppState } from "../../state/AppState";
import type { WeightLog } from "../../types";
import {
  Button,
  Card,
  Divider,
  EmptyState,
  ErrorState,
  Loading,
  Screen,
  SectionTitle,
  TextField,
  colors,
  radius,
  spacing,
  typography,
  TOUCH,
  useUnsavedChangesGuard,
} from "../../ui";
import { buildWeightChart } from "./aggregate";

// Same range as the profile form.
const MIN_KG = 30;
const MAX_KG = 300;

/** Parses a typed weight; null when outside 30-300 kg or not a number. */
export function parseWeight(text: string): number | null {
  const n = parseAmount(text);
  if (n === null) return null;
  return n >= MIN_KG && n <= MAX_KG ? n : null;
}

export function WeightScreen() {
  const { t, lang } = useI18n();
  const db = useDb();
  const { profile, saveProfile, dataVersion, notifyDataChanged } = useAppState();
  const [weights, setWeights] = useState<WeightLog[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [offerKg, setOfferKg] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  useUnsavedChangesGuard(text.trim() !== "");

  useEffect(() => {
    let active = true;
    listWeights(db)
      .then((rows) => {
        if (!active) return;
        setWeights(rows);
        setFailed(false);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [db, dataVersion, attempt]);

  const chart = useMemo(() => (weights ? buildWeightChart(weights, 30) : null), [weights]);
  const today = todayInIstanbul();
  const hasToday = weights?.some((w) => w.date === today) ?? false;

  const onSave = useCallback(async () => {
    const kg = parseWeight(text);
    if (kg === null) {
      setError(t("features.history.weightInvalid"));
      setNotice(null);
      return;
    }
    setError(null);
    Keyboard.dismiss();
    setBusy(true);
    try {
      await addWeight(db, todayInIstanbul(), kg);
      notifyDataChanged();
      setText("");
      setNotice(t("features.history.weightSaved"));
      setOfferKg(profile && Math.abs(profile.weightKg - kg) >= 0.05 ? kg : null);
    } catch {
      setError(t("errors.saveFailed"));
    } finally {
      setBusy(false);
    }
  }, [db, notifyDataChanged, profile, t, text]);

  const onUpdateProfile = useCallback(async () => {
    if (!profile || offerKg === null) return;
    const { createdAt: _createdAt, updatedAt: _updatedAt, ...input } = profile;
    void _createdAt;
    void _updatedAt;
    try {
      await saveProfile({ ...input, weightKg: offerKg });
      setOfferKg(null);
      setNotice(t("features.history.offerDone"));
    } catch {
      setError(t("errors.saveFailed"));
    }
  }, [offerKg, profile, saveProfile, t]);

  const confirmDelete = (w: WeightLog) => {
    Alert.alert(
      t("features.history.deleteTitle"),
      t("features.history.deleteMessage", { date: formatDate(w.date, lang), kg: formatNumber(w.kg, lang, 1) }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => {
            deleteWeight(db, w.id)
              .then(() => notifyDataChanged())
              .catch(() => setError(t("errors.saveFailed")));
          },
        },
      ],
    );
  };

  if (failed) {
    return (
      <Screen>
        <ErrorState
          message={t("features.history.weightLoadFailed")}
          retryLabel={t("errors.retry")}
          onRetry={() => setAttempt((a) => a + 1)}
        />
      </Screen>
    );
  }
  if (!weights) {
    return (
      <Screen>
        <Loading label={t("common.loading")} />
      </Screen>
    );
  }

  const newestFirst = [...weights].reverse();

  return (
    <Screen>
      <Card>
        <SectionTitle>{t("features.history.weightToday")}</SectionTitle>
        <TextField
          testID="weight-input"
          label={t("features.history.weightInput")}
          value={text}
          onChangeText={(v) => {
            setText(v);
            setError(null);
          }}
          keyboardType="decimal-pad"
          inputMode="decimal"
          suffix="kg"
          error={error}
          hint={hasToday ? t("features.history.weightSameDay") : undefined}
        />
        <Button label={t("features.history.weightSave")} onPress={onSave} loading={busy} />
        {notice ? (
          <Text accessibilityRole="alert" style={typography.muted}>
            {notice}
          </Text>
        ) : null}
        {offerKg !== null && profile ? (
          <View style={styles.offer}>
            <Text style={typography.body}>
              {t("features.history.offerTitle", {
                profile: formatNumber(profile.weightKg, lang, 1),
                kg: formatNumber(offerKg, lang, 1),
              })}
            </Text>
            <Button label={t("features.history.offerAction")} onPress={onUpdateProfile} variant="secondary" />
            <Button label={t("features.history.offerDismiss")} onPress={() => setOfferKg(null)} variant="ghost" />
          </View>
        ) : null}
      </Card>

      {chart ? <WeightChartView chart={chart} /> : <EmptyState message={t("features.history.weightEmpty")} />}

      {newestFirst.length > 0 ? (
        <Card>
          <SectionTitle>{t("features.history.entries")}</SectionTitle>
          {newestFirst.map((w, i) => (
            <View key={w.id}>
              {i > 0 ? <Divider /> : null}
              <View style={styles.entryRow}>
                <View style={{ flex: 1 }}>
                  <Text style={typography.body}>{t("features.history.entryRow", { kg: formatNumber(w.kg, lang, 1) })}</Text>
                  <Text style={typography.muted}>{formatDate(w.date, lang)}</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("features.history.deleteEntry", { date: formatDate(w.date, lang) })}
                  onPress={() => confirmDelete(w)}
                  style={styles.deleteBtn}
                >
                  <Text style={[typography.label, { color: colors.danger }]}>{t("common.delete")}</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}

const CHART_HEIGHT = 96;

function WeightChartView({ chart }: { chart: NonNullable<ReturnType<typeof buildWeightChart>> }) {
  const { t, lang } = useI18n();
  const summary =
    chart.points.length === 1
      ? t("features.history.chartSingle", { kg: formatNumber(chart.last, lang, 1) })
      : t("features.history.chartSummary", {
          count: chart.points.length,
          from: formatNumber(chart.first, lang, 1),
          to: formatNumber(chart.last, lang, 1),
        });
  return (
    <Card>
      <SectionTitle>{t("features.history.chartTitle")}</SectionTitle>
      <Text style={typography.body}>{summary}</Text>
      <View accessible accessibilityRole="image" accessibilityLabel={summary} style={styles.chart}>
        {chart.points.map((p) => (
          <View key={p.id} style={styles.barSlot}>
            <View
              testID={`weight-bar-${p.date}`}
              style={[styles.bar, { height: 8 + p.fraction * (CHART_HEIGHT - 8) }]}
            />
          </View>
        ))}
      </View>
      <View style={styles.minMax}>
        <Text style={typography.small}>{t("features.history.chartMin", { kg: formatNumber(chart.min, lang, 1) })}</Text>
        <Text style={typography.small}>{t("features.history.chartMax", { kg: formatNumber(chart.max, lang, 1) })}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  offer: { gap: spacing.sm, padding: spacing.md, backgroundColor: colors.primarySoft, borderRadius: radius.md },
  entryRow: { minHeight: TOUCH, flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.xs },
  deleteBtn: { minHeight: TOUCH, minWidth: TOUCH, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.sm },
  chart: { height: CHART_HEIGHT, flexDirection: "row", alignItems: "flex-end", gap: 2 },
  barSlot: { flex: 1, justifyContent: "flex-end" },
  bar: { width: "100%", backgroundColor: colors.primary, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  minMax: { flexDirection: "row", justifyContent: "space-between" },
});
