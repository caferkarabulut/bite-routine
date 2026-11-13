import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { getCatalogItem } from "../../catalog";
import { addEntry, addFavorite, getCustomFood, isFavorite, removeFavorite, useDb } from "../../db";
import { nutrientsForGrams, todayInIstanbul } from "../../domain";
import { formatDate, formatGrams, formatKcal, useI18n } from "../../i18n";
import { useAppState } from "../../state/AppState";
import type { LocalDate, MealSlot, Nutrients } from "../../types";
import {
  AmountInput,
  Button,
  Card,
  DayNavigator,
  EmptyState,
  Loading,
  MealSlotPicker,
  Screen,
  SectionTitle,
  TOUCH,
  colors,
  defaultAmount,
  mealSlotForTime,
  resolveAmount,
  spacing,
  typography,
  type AmountValue,
} from "../../ui";
import { asLocalDate, asMealSlot, asString, viewOfCatalogItem, viewOfCustomFood, type FoodView } from "./foodView";

export function FoodDetailScreen() {
  const { t, lang } = useI18n();
  const db = useDb();
  const { dataVersion } = useAppState();
  const params = useLocalSearchParams<{ id?: string; date?: string; meal?: string }>();
  const id = asString(params.id);
  const isCustomId = !!id && id.startsWith("custom-");
  const [custom, setCustom] = useState<FoodView | null | undefined>(undefined);

  useEffect(() => {
    if (!id || !isCustomId) return;
    let active = true;
    getCustomFood(db, id)
      .then((f) => active && setCustom(f ? viewOfCustomFood(f) : null))
      .catch(() => active && setCustom(null));
    return () => {
      active = false;
    };
  }, [db, id, isCustomId, dataVersion]);

  const catalogFood = useMemo(() => {
    const item = id && !isCustomId ? getCatalogItem(id) : undefined;
    return item ? viewOfCatalogItem(item, lang) : null;
  }, [id, isCustomId, lang]);
  const food: FoodView | null | undefined = !id ? null : isCustomId ? custom : catalogFood;

  if (food === undefined) {
    return (
      <Screen>
        <Loading label={t("common.loading")} />
      </Screen>
    );
  }
  if (food === null) {
    return (
      <Screen>
        <Stack.Screen options={{ title: t("catalog.title") }} />
        <EmptyState message={`${t("features.catalog.notFound")}\n${t("features.catalog.notFoundHint")}`} />
      </Screen>
    );
  }
  return (
    <FoodDetail
      key={`${food.ref.id}:${lang}`}
      food={food}
      initialDate={asLocalDate(params.date)}
      initialMeal={asMealSlot(params.meal)}
    />
  );
}

function FoodDetail({
  food,
  initialDate,
  initialMeal,
}: {
  food: FoodView;
  initialDate: LocalDate | undefined;
  initialMeal: MealSlot | undefined;
}) {
  const { t, lang } = useI18n();
  const db = useDb();
  const { notifyDataChanged } = useAppState();
  const [amount, setAmount] = useState<AmountValue>(() => defaultAmount(food.portions));
  const [meal, setMeal] = useState<MealSlot>(() => initialMeal ?? mealSlotForTime());
  const [date, setDate] = useState<LocalDate>(() => initialDate ?? todayInIstanbul());
  const [favorite, setFavorite] = useState(false);
  const [showError, setShowError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const { kind: refKind, id: refId } = food.ref;

  useEffect(() => {
    let active = true;
    isFavorite(db, { kind: refKind, id: refId })
      .then((v) => active && setFavorite(v))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [db, refKind, refId]);

  const resolved = resolveAmount(amount, food.portions, lang);

  const toggleFavorite = async () => {
    const next = !favorite;
    setFavorite(next);
    try {
      if (next) await addFavorite(db, food.ref);
      else await removeFavorite(db, food.ref);
      notifyDataChanged();
    } catch {
      setFavorite(!next);
    }
  };

  const submit = async () => {
    if (!resolved) {
      setShowError(true);
      return;
    }
    setSaving(true);
    setFailed(false);
    try {
      await addEntry(db, {
        date,
        mealSlot: meal,
        food: food.ref,
        foodName: food.name,
        grams: resolved.grams,
        portion: resolved.portion,
        per100g: food.per100g,
      });
      notifyDataChanged();
      router.dismissTo({ pathname: "/", params: { date } });
    } catch {
      setFailed(true);
      setSaving(false);
    }
  };

  const preview = resolved ? nutrientsForGrams(food.per100g, resolved.grams) : null;
  const sourceLine = sourceFor(food, t);

  return (
    <Screen>
      <Stack.Screen options={{ title: food.name }} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Text accessibilityRole="header" style={typography.title}>
            {food.name}
          </Text>
          <Text style={typography.muted}>
            {food.isCustom ? t("catalog.kinds.custom") : t(`catalog.kinds.${food.ref.kind as "dish" | "food" | "packaged"}`)}
            {food.brand ? ` · ${food.brand}` : ""}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={favorite ? t("catalog.removeFavorite") : t("catalog.addFavorite")}
          accessibilityState={{ selected: favorite }}
          onPress={toggleFavorite}
          style={{ width: TOUCH, height: TOUCH, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ fontSize: 28, color: favorite ? colors.danger : colors.textMuted }}>{favorite ? "♥" : "♡"}</Text>
        </Pressable>
      </View>

      <Card>
        <Text style={typography.label}>{t("features.catalog.nutrition")}</Text>
        <NutrientRows values={food.per100g} />
        <Text style={typography.small}>{sourceLine}</Text>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={t("features.catalog.viewSources")}
          onPress={() => router.push("/sources")}
          style={{ minHeight: TOUCH, justifyContent: "center" }}
        >
          <Text style={[typography.label, { color: colors.primary }]}>{t("features.catalog.viewSources")}</Text>
        </Pressable>
      </Card>

      {food.isCustom ? (
        <Button
          label={t("common.edit")}
          variant="secondary"
          onPress={() => router.push({ pathname: "/custom-food", params: { id: food.ref.id } })}
        />
      ) : null}

      <SectionTitle>{t("features.catalog.addTitle")}</SectionTitle>
      <AmountInput portions={food.portions} value={amount} onChange={setAmount} showError={showError} />
      <MealSlotPicker value={meal} onChange={setMeal} />
      <View style={{ gap: spacing.xs }}>
        <Text style={typography.label}>{t("common.date")}</Text>
        <DayNavigator date={date} onChange={setDate} />
        <Text style={typography.muted}>{formatDate(date, lang)}</Text>
      </View>

      <Card>
        <Text style={typography.label}>
          {t("features.catalog.previewFor", { grams: resolved ? formatGrams(resolved.grams, lang) : "—" })}
        </Text>
        {preview ? <NutrientRows values={preview} /> : null}
      </Card>

      {failed ? (
        <Text accessibilityRole="alert" style={[typography.body, { color: colors.danger }]}>
          {t("features.catalog.addFailed")}
        </Text>
      ) : null}
      <Button testID="add-to-diary" label={t("catalog.addToDiary")} onPress={submit} loading={saving} />
      <Text style={typography.small}>{t("disclaimer")}</Text>
    </Screen>
  );
}

function sourceFor(food: FoodView, t: ReturnType<typeof useI18n>["t"]): string {
  if (food.isCustom) return t("features.catalog.sourceCustom");
  switch (food.ref.kind) {
    case "dish":
      return t("features.catalog.sourceDish");
    case "packaged":
      return food.brand
        ? t("features.catalog.sourcePackaged", { brand: food.brand })
        : t("features.catalog.sourcePackagedNoBrand");
    default:
      return t("features.catalog.sourceFood");
  }
}

function NutrientRows({ values }: { values: Nutrients }) {
  const { t, lang } = useI18n();
  const missing = t("common.noData");
  const rows: { label: string; value: string }[] = [
    { label: t("macros.kcal"), value: values.kcal === null ? missing : formatKcal(values.kcal, lang) },
    { label: t("macros.protein"), value: values.protein === null ? missing : formatGrams(values.protein, lang) },
    { label: t("macros.carbs"), value: values.carbs === null ? missing : formatGrams(values.carbs, lang) },
    { label: t("macros.fat"), value: values.fat === null ? missing : formatGrams(values.fat, lang) },
  ];
  return (
    <View style={{ gap: spacing.xs }}>
      {rows.map((r) => (
        <View
          key={r.label}
          accessible
          accessibilityLabel={`${r.label}: ${r.value}`}
          style={{ flexDirection: "row", justifyContent: "space-between" }}
        >
          <Text style={typography.body}>{r.label}</Text>
          <Text style={typography.label}>{r.value}</Text>
        </View>
      ))}
    </View>
  );
}
