import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { categoryLabel, getCatalogItem } from "../../catalog";
import { addEntry, addFavorite, getCustomFood, isFavorite, removeFavorite, useDb } from "../../db";
import { nutrientsForGrams, todayInIstanbul } from "../../domain";
import { formatDate, formatGrams, formatKcal, formatNumber, useI18n } from "../../i18n";
import { useAppState } from "../../state/AppState";
import { MEAL_SLOTS, type LocalDate, type MealSlot } from "../../types";
import {
  Button,
  Card,
  Chip,
  DayNavigator,
  Divider,
  EmptyState,
  Icon,
  IconButton,
  Loading,
  Screen,
  Stepper,
  TOUCH,
  colors,
  defaultAmount,
  fonts,
  mealSlotForTime,
  portionAmountText,
  portionName,
  radius,
  resolveAmount,
  spacing,
  typography,
  type AmountValue,
} from "../../ui";
import { AddedByYouPill } from "./AddedByYouPill";
import { amountStepRange } from "./amountStep";
import { asLocalDate, asMealSlot, asString, formatFoodAmount, viewOfCatalogItem, viewOfCustomFood, type FoodView } from "./foodView";

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
      <Screen edges={["top", "bottom"]}>
        <BackBar />
        <Loading label={t("common.loading")} />
      </Screen>
    );
  }
  if (food === null) {
    return (
      <Screen edges={["top", "bottom"]}>
        <BackBar />
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

/** Back to the catalog (named after the previous screen) with an optional trailing action. */
function BackBar({ right }: { right?: ReactNode }) {
  const { t } = useI18n();
  return (
    <View style={styles.backBar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t("common.back")}, ${t("catalog.title")}`}
        onPress={() => (router.canGoBack() ? router.back() : router.replace("/catalog"))}
        style={styles.backButton}
      >
        <Icon name="chevronLeft" size={22} color={colors.text} />
        <Text style={styles.backText}>{t("catalog.title")}</Text>
      </Pressable>
      {right}
    </View>
  );
}

type OpenRow = "meal" | "date" | null;

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
  const [open, setOpen] = useState<OpenRow>(null);
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
  const isGrams = amount.unit === "grams";
  const chosenPortion = isGrams ? undefined : food.portions.find((p) => p.id === amount.unit);

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
  const kindLabel = food.isCustom ? t("catalog.kinds.custom") : t(`catalog.kinds.${food.ref.kind as "dish" | "food" | "packaged"}`);
  const kindLine = [
    kindLabel,
    food.brand || (food.ref.kind === "packaged" || !food.category ? null : categoryLabel(food.category, lang)),
    food.isCustom ? formatFoodAmount(food, food.portions[0]?.grams ?? 100, lang) : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const amountText = resolved
    ? [resolved.portion ? portionAmountText(resolved.portion.quantity, resolved.portion.name, lang) : null, formatFoodAmount(food, resolved.grams, lang)]
        .filter(Boolean)
        .join(" · ")
    : "—";
  const range = amountStepRange(chosenPortion ? chosenPortion.grams : null);
  const addLabel = t("catalog.addToDiary");
  const kcalLabel = preview && preview.kcal !== null ? formatKcal(preview.kcal, lang) : null;
  const today = todayInIstanbul();
  const dateValue = date === today ? t("features.catalog.todayDate", { date: formatDate(date, lang) }) : formatDate(date, lang);

  return (
    <Screen
      edges={["top", "bottom"]}
      footer={
        <>
          {failed ? (
            <Text accessibilityRole="alert" style={[typography.body, { color: colors.danger, textAlign: "center" }]}>
              {t("features.catalog.addFailed")}
            </Text>
          ) : null}
          <Text style={[typography.small, { textAlign: "center" }]}>{t("disclaimer")}</Text>
          <Pressable
            testID="add-to-diary"
            accessibilityRole="button"
            accessibilityLabel={kcalLabel ? `${addLabel}, ${kcalLabel}` : addLabel}
            accessibilityState={{ disabled: saving, busy: saving }}
            disabled={saving}
            onPress={submit}
            style={({ pressed }) => [styles.cta, pressed ? { backgroundColor: colors.primaryPressed } : null, saving ? { opacity: 0.45 } : null]}
          >
            {saving ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.ctaText}>{kcalLabel ? `${addLabel} · ${kcalLabel}` : addLabel}</Text>
            )}
          </Pressable>
        </>
      }
    >
      <BackBar
        right={
          <IconButton
            icon="heart"
            filled={favorite}
            color={favorite ? colors.danger : colors.text}
            size={24}
            selected={favorite}
            accessibilityLabel={favorite ? t("catalog.removeFavorite") : t("catalog.addFavorite")}
            onPress={toggleFavorite}
          />
        }
      />

      <View style={styles.titleBlock}>
        <Text accessibilityRole="header" style={typography.title}>
          {food.name}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.sm }}>
          {food.isCustom ? <AddedByYouPill /> : null}
          <Text style={styles.kindLine}>{kindLine}</Text>
        </View>
      </View>

      <Card style={{ gap: spacing.md }}>
        <View accessibilityLiveRegion="polite" style={styles.kcalRow}>
          <Text style={styles.kcalValue}>
            {preview && preview.kcal !== null ? formatNumber(preview.kcal, lang) : "—"}
            <Text style={styles.kcalUnit}> kcal</Text>
          </Text>
          <Text style={[typography.footnote, styles.amountText]}>{amountText}</Text>
        </View>
        <Divider />
        <View style={styles.macroGrid}>
          <Macro label={t("macros.protein")} value={preview?.protein ?? null} />
          <Macro label={t("macros.carbs")} value={preview?.carbs ?? null} />
          <Macro label={t("macros.fat")} value={preview?.fat ?? null} />
        </View>
        <View>
          <Text style={typography.footnote}>
            {t(food.isDrink ? "features.catalog.per100mlLine" : "features.catalog.per100Line", { kcal: food.per100g.kcal === null ? t("common.noData") : formatKcal(food.per100g.kcal, lang) })}
          </Text>
          <Text style={typography.footnote}>{sourceFor(food, t)}</Text>
        </View>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={t("features.catalog.viewSources")}
          onPress={() => router.push("/sources")}
          style={{ minHeight: TOUCH, justifyContent: "center" }}
        >
          <Text style={styles.link}>{t("features.catalog.viewSources")}</Text>
        </Pressable>
      </Card>

      {food.isCustom ? (
        <Button
          label={t("common.edit")}
          variant="secondary"
          size="md"
          onPress={() => router.push({ pathname: "/custom-food", params: { id: food.ref.id } })}
        />
      ) : null}

      {food.portions.length > 0 ? (
        <View style={styles.group}>
          <Text style={styles.groupLabel}>{t("catalog.portion")}</Text>
          <View style={styles.pills} accessibilityRole="radiogroup" accessibilityLabel={t("catalog.portion")}>
            <Chip
              label={t(food.isDrink ? "features.catalog.millilitres" : "catalog.grams")}
              accessibilityRole="radio"
              selected={isGrams}
              onPress={() => setAmount({ unit: "grams", text: "100" })}
            />
            {food.portions.map((p) => (
              <Chip
                key={p.id}
                label={`${portionName(p, lang)} (${formatFoodAmount(food, p.grams, lang)})`}
                accessibilityRole="radio"
                selected={amount.unit === p.id}
                onPress={() => setAmount({ unit: p.id, text: "1" })}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.amountRow}>
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.groupLabel}>{t("catalog.quantity")}</Text>
          <Text style={typography.footnote}>{isGrams ? t(food.isDrink ? "features.catalog.millilitres" : "catalog.grams") : resolved ? `≈ ${formatFoodAmount(food, resolved.grams, lang)}` : " "}</Text>
        </View>
        <Stepper
          testID="amount-input"
          label={isGrams ? t(food.isDrink ? "features.catalog.millilitres" : "catalog.grams") : t("catalog.quantity")}
          value={amount.text}
          onChangeText={(text) => setAmount({ ...amount, text })}
          min={range.min}
          max={range.max}
          step={range.step}
          showDone
        />
      </View>
      {showError && !resolved ? (
        <Text accessibilityRole="alert" style={[typography.small, { color: colors.danger }]}>
          {t("catalog.invalidAmount")}
        </Text>
      ) : null}

      <Card padded={false} style={{ gap: 0 }}>
        <PickerRow
          label={t("catalog.chooseMeal")}
          value={t(`meals.${meal}`)}
          expanded={open === "meal"}
          onPress={() => setOpen(open === "meal" ? null : "meal")}
        />
        {open === "meal" ? (
          <View style={styles.expanded} accessibilityRole="radiogroup" accessibilityLabel={t("catalog.chooseMeal")}>
            {MEAL_SLOTS.map((slot) => (
              <Chip
                key={slot}
                label={t(`meals.${slot}`)}
                accessibilityRole="radio"
                selected={slot === meal}
                onPress={() => {
                  setMeal(slot);
                  setOpen(null);
                }}
              />
            ))}
          </View>
        ) : null}
        <Divider inset={18} />
        <PickerRow
          label={t("common.date")}
          value={dateValue}
          expanded={open === "date"}
          onPress={() => setOpen(open === "date" ? null : "date")}
        />
        {open === "date" ? (
          <View style={styles.expanded}>
            <View style={{ flex: 1, minWidth: 220 }}>
            <DayNavigator date={date} onChange={setDate} />
            </View>
          </View>
        ) : null}
      </Card>
    </Screen>
  );
}

function PickerRow({
  label,
  value,
  expanded,
  onPress,
}: {
  label: string;
  value: string;
  expanded: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${value}`}
      accessibilityState={{ expanded }}
      onPress={onPress}
      style={styles.pickerRow}
    >
      <Text style={styles.pickerLabel}>{label}</Text>
      <View style={styles.pickerValue}>
        <Text style={styles.pickerValueText}>{value}</Text>
        <View style={{ transform: [{ rotate: expanded ? "-90deg" : "90deg" }] }}>
          <Icon name="chevronRight" size={16} color={colors.text} />
        </View>
      </View>
    </Pressable>
  );
}

function Macro({ label, value }: { label: string; value: number | null }) {
  const { t, lang } = useI18n();
  const text = value === null ? t("common.noData") : formatGrams(value, lang);
  return (
    <View accessible accessibilityLabel={`${label}: ${text}`} style={{ flex: 1 }}>
      <Text style={typography.footnote}>{label}</Text>
      <Text style={styles.macroValue}>{text}</Text>
    </View>
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

const styles = StyleSheet.create({
  backBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: -spacing.sm },
  backButton: { minHeight: TOUCH, flexDirection: "row", alignItems: "center", gap: 2, paddingRight: spacing.sm },
  backText: { fontFamily: fonts.regular, fontSize: 17, color: colors.text },
  titleBlock: { gap: 2, marginTop: -spacing.sm },
  kindLine: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 20, color: colors.textMuted },
  kcalRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", columnGap: spacing.md },
  kcalValue: { fontFamily: fonts.extrabold, fontSize: 44, lineHeight: 52, color: colors.accentText, fontVariant: ["tabular-nums"] },
  kcalUnit: { fontFamily: fonts.bold, fontSize: 17, color: colors.accentText },
  amountText: { flexShrink: 1 },
  macroGrid: { flexDirection: "row", gap: spacing.sm },
  macroValue: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 22, color: colors.text, fontVariant: ["tabular-nums"] },
  link: { fontFamily: fonts.bold, fontSize: 15, color: colors.text, textDecorationLine: "underline" },
  group: { gap: spacing.sm },
  groupLabel: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 20, color: colors.text },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  amountRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingLeft: spacing.xs,
  },
  pickerRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingLeft: 18,
    paddingRight: 14,
    paddingVertical: spacing.sm,
  },
  pickerLabel: { fontFamily: fonts.regular, fontSize: 16, color: colors.text },
  pickerValue: { flexShrink: 1, flexDirection: "row", alignItems: "center", gap: spacing.xs },
  pickerValueText: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, flexShrink: 1, textAlign: "right" },
  expanded: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  cta: {
    minHeight: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  ctaText: { fontFamily: fonts.bold, fontSize: 17, color: colors.onPrimary, textAlign: "center", fontVariant: ["tabular-nums"] },
});
