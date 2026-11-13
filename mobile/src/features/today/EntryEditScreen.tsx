import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Text, View } from "react-native";

import { getCatalogItem } from "../../catalog";
import { deleteEntry, getCustomFood, getEntry, updateEntry, useDb } from "../../db";
import { nutrientsForGrams } from "../../domain";
import { formatKcal, formatGrams, useI18n } from "../../i18n";
import { useAppState } from "../../state/AppState";
import type { DiaryEntry, DiaryEntryPatch, LocalDate, MealSlot, Portion } from "../../types";
import {
  AmountInput,
  Button,
  Card,
  colors,
  DayNavigator,
  EmptyState,
  ErrorState,
  Loading,
  MealSlotPicker,
  resolveAmount,
  Screen,
  SectionTitle,
  spacing,
  typography,
  type AmountValue,
} from "../../ui";

type Loaded = { entry: DiaryEntry; portions: Portion[]; foodMissing: boolean };

/** Food portions, with the entry's stored portion snapshot taking precedence for its own id. */
async function loadPortions(db: ReturnType<typeof useDb>, entry: DiaryEntry): Promise<{ portions: Portion[]; missing: boolean }> {
  const food =
    entry.food.kind === "custom" ? await getCustomFood(db, entry.food.id) : (getCatalogItem(entry.food.id) ?? null);
  const portions = [...(food?.portions ?? [])];
  const snap = entry.portion;
  if (snap) {
    const stored: Portion = { id: snap.id, nameTr: snap.name, nameEn: null, grams: snap.gramsPerUnit };
    const idx = portions.findIndex((p) => p.id === snap.id);
    if (idx >= 0) portions[idx] = stored;
    else portions.push(stored);
  }
  return { portions, missing: food === null };
}

function initialAmount(entry: DiaryEntry, lang: "tr" | "en"): AmountValue {
  const text = (n: number) => String(n).replace(".", lang === "tr" ? "," : ".");
  return entry.portion ? { unit: entry.portion.id, text: text(entry.portion.quantity) } : { unit: "grams", text: text(entry.grams) };
}

export function EntryEditScreen() {
  const { t, lang } = useI18n();
  const db = useDb();
  const { notifyDataChanged } = useAppState();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [amount, setAmount] = useState<AmountValue>({ unit: "grams", text: "" });
  const [meal, setMeal] = useState<MealSlot>("breakfast");
  const [date, setDate] = useState<LocalDate>("");
  const [showError, setShowError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const entry = id ? await getEntry(db, id) : null;
        if (!active) return;
        if (!entry) {
          setNotFound(true);
          return;
        }
        const { portions, missing } = await loadPortions(db, entry);
        if (!active) return;
        setLoaded({ entry, portions, foodMissing: missing });
        setAmount(initialAmount(entry, lang));
        setMeal(entry.mealSlot);
        setDate(entry.date);
        setNotFound(false);
        setLoadError(false);
      } catch {
        if (active) setLoadError(true);
      }
    })();
    return () => {
      active = false;
    };
    // The editor state is initialised once per entry; language changes must not reset typed input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, id, reloadKey]);

  const resolved = useMemo(
    () => (loaded ? resolveAmount(amount, loaded.portions, lang) : null),
    [loaded, amount, lang],
  );

  if (loadError) {
    return (
      <Screen>
        <ErrorState message={t("errors.loadFailed")} retryLabel={t("errors.retry")} onRetry={() => setReloadKey((k) => k + 1)} />
      </Screen>
    );
  }
  if (notFound) {
    return (
      <Screen>
        <EmptyState message={t("features.today.entryNotFound")} action={<Button label={t("common.back")} variant="secondary" onPress={() => router.back()} />} />
      </Screen>
    );
  }
  if (!loaded) {
    return (
      <Screen>
        <Loading label={t("common.loading")} />
      </Screen>
    );
  }

  const { entry, portions } = loaded;
  const preview = resolved ? nutrientsForGrams(entry.per100g, resolved.grams) : null;

  const buildPatch = (): DiaryEntryPatch | null => {
    if (!resolved) return null;
    const patch: DiaryEntryPatch = {};
    if (date !== entry.date) patch.date = date;
    if (meal !== entry.mealSlot) patch.mealSlot = meal;
    const p = entry.portion;
    const q = resolved.portion;
    const samePortion =
      p === null || q === null
        ? p === q
        : p.id === q.id && p.quantity === q.quantity && p.gramsPerUnit === q.gramsPerUnit;
    if (resolved.grams !== entry.grams || !samePortion) {
      patch.grams = resolved.grams;
      patch.portion = resolved.portion;
    }
    return patch;
  };

  const save = async () => {
    const patch = buildPatch();
    if (!patch) {
      setShowError(true);
      return;
    }
    setBusy(true);
    setSaveError(false);
    try {
      if (Object.keys(patch).length > 0) {
        await updateEntry(db, entry.id, patch);
        notifyDataChanged();
      }
      router.back();
    } catch {
      setSaveError(true);
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setSaveError(false);
    try {
      await deleteEntry(db, entry.id);
      notifyDataChanged();
      router.back();
    } catch {
      setSaveError(true);
      setBusy(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(t("features.today.deleteTitle"), t("common.confirmDelete"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("common.delete"), style: "destructive", onPress: () => void remove() },
    ]);
  };

  return (
    <Screen>
      <Text accessibilityRole="header" style={typography.title}>
        {entry.foodName}
      </Text>
      {loaded.foodMissing ? <Text style={typography.muted}>{t("features.today.foodMissing")}</Text> : null}

      <Card>
        <AmountInput portions={portions} value={amount} onChange={setAmount} showError={showError} />
        <View style={{ gap: spacing.xs }}>
          <Text style={typography.label}>{t("catalog.preview")}</Text>
          <Text style={typography.heading}>{preview ? formatKcal(preview.kcal, lang) : t("common.noData")}</Text>
          {preview ? (
            <Text style={typography.muted}>
              {`${t("macros.protein")} ${preview.protein === null ? t("common.noData") : formatGrams(preview.protein, lang)} · ${t("macros.carbs")} ${preview.carbs === null ? t("common.noData") : formatGrams(preview.carbs, lang)} · ${t("macros.fat")} ${preview.fat === null ? t("common.noData") : formatGrams(preview.fat, lang)}`}
            </Text>
          ) : null}
        </View>
      </Card>

      <Card>
        <MealSlotPicker value={meal} onChange={setMeal} />
        <SectionTitle>{t("common.date")}</SectionTitle>
        <DayNavigator date={date} onChange={setDate} />
      </Card>

      {saveError ? (
        <Text accessibilityRole="alert" style={[typography.body, { color: colors.danger }]}>
          {t("errors.saveFailed")}
        </Text>
      ) : null}

      <Button label={t("common.save")} onPress={() => void save()} disabled={busy} loading={busy} />
      <Button label={t("features.today.deleteEntry")} variant="danger" onPress={confirmDelete} disabled={busy} />
    </Screen>
  );
}
