import { router, useLocalSearchParams } from "expo-router";
import { memo, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { CATEGORY_ORDER, categoryLabel, foldTr, getCatalogItem, searchCatalog } from "../../catalog";
import { listCustomFoods, listFavorites, listRecentFoodRefs, useDb } from "../../db";
import { todayInIstanbul } from "../../domain";
import { formatDate, formatKcal, useI18n } from "../../i18n";
import { useAppState } from "../../state/AppState";
import type { CustomFood, FoodRef, MealSlot } from "../../types";
import {
  Card,
  Chip,
  Divider,
  EmptyState,
  Icon,
  Screen,
  SearchBar,
  SegmentedControl,
  colors,
  fonts,
  mealSlotForTime,
  spacing,
  typography,
} from "../../ui";
import { AddedByYouPill } from "./AddedByYouPill";
import { asLocalDate, asMealSlot, defaultServing, recentFoodViews, viewOfCatalogItem, viewOfCustomFood, type FoodView } from "./foodView";

type Segment = "all" | "favorites" | "mine";

/** One titled card of food rows. `title` is omitted when the card is the only content. */
type Section = { key: string; title?: string; foods: FoodView[] };

const CATEGORY_LIMIT = 300;
const SEARCH_LIMIT = 50;

export function CatalogScreen() {
  const { t, lang } = useI18n();
  const db = useDb();
  const { dataVersion } = useAppState();
  const params = useLocalSearchParams<{ date?: string; meal?: string }>();
  const date = asLocalDate(params.date);
  const meal = asMealSlot(params.meal);
  const adding = date !== undefined || meal !== undefined;

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [segment, setSegment] = useState<Segment>("all");
  const [category, setCategory] = useState<string | null>(null);
  const [customFoods, setCustomFoods] = useState<CustomFood[]>([]);
  const [recentRefs, setRecentRefs] = useState<FoodRef[]>([]);
  const [favorites, setFavorites] = useState<FoodRef[]>([]);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 150);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    let active = true;
    Promise.all([listCustomFoods(db), listFavorites(db), listRecentFoodRefs(db)])
      .then(([foods, favs, recents]) => {
        if (!active) return;
        setCustomFoods(foods);
        setFavorites(favs);
        setRecentRefs(recents);
      })
      .catch(() => {
        // Lists stay empty; the catalog itself still works.
      });
    return () => {
      active = false;
    };
  }, [db, dataVersion]);

  const q = foldTr(debounced);
  const recentFoods = useMemo(() => recentFoodViews(recentRefs, customFoods, lang, getCatalogItem), [recentRefs, customFoods, lang]);

  const sections = useMemo<Section[]>(() => {
    const matchingCustom = customFoods.filter((f) => !q || foldTr(f.nameTr).includes(q)).map(viewOfCustomFood);

    if (segment === "mine") return [{ key: "mine", foods: matchingCustom }];

    if (segment === "favorites") {
      const foods: FoodView[] = [];
      for (const ref of favorites) {
        let food: FoodView | null = null;
        if (ref.kind === "custom") {
          const c = customFoods.find((f) => f.id === ref.id);
          if (c) food = viewOfCustomFood(c);
        } else {
          const item = getCatalogItem(ref.id);
          if (item) food = viewOfCatalogItem(item, lang);
        }
        if (!food) continue;
        if (q && !foldTr(food.nameTr).includes(q) && !foldTr(food.name).includes(q)) continue;
        foods.push(food);
      }
      return [{ key: "favorites", foods }];
    }

    // segment "all"
    if (q) {
      const found = searchCatalog(debounced, { limit: SEARCH_LIMIT }).map((item) => viewOfCatalogItem(item, lang));
      if (matchingCustom.length === 0) return [{ key: "catalog", foods: found }];
      const out: Section[] = [{ key: "mine", title: t("catalog.myFoods"), foods: matchingCustom }];
      if (found.length > 0) out.push({ key: "catalog", title: t("catalog.title"), foods: found });
      return out;
    }
    if (category) {
      const foods = searchCatalog("", { category, limit: CATEGORY_LIMIT }).map((item) => viewOfCatalogItem(item, lang));
      return [{ key: "category", title: categoryLabel(category, lang), foods }];
    }
    return [];
  }, [segment, q, debounced, category, customFoods, favorites, lang, t]);

  const openFood = (food: FoodView) => {
    router.push({
      pathname: "/food/[id]",
      params: { id: food.ref.id, ...(date ? { date } : {}), ...(meal ? { meal } : {}) },
    });
  };

  const showCategories = segment === "all" && !q && !category;
  const hasFoods = sections.some((s) => s.foods.length > 0);

  const empty = (() => {
    if (segment === "favorites" && !q) return <EmptyState message={t("catalog.noFavorites")} />;
    if (segment === "mine" && !q) {
      return <EmptyState message={`${t("features.catalog.noMyFoods")}\n${t("features.catalog.noMyFoodsHint")}`} />;
    }
    return <EmptyState message={`${t("catalog.noResults")}\n${t("catalog.noResultsHint")}`} />;
  })();

  return (
    <Screen
      edges={["top"]}
      largeTitle={t("catalog.title")}
      centerHeader
      headerRight={<View style={{ width: 44, height: 44 }} />}
    >
      {adding ? (
        <Card style={{ backgroundColor: colors.primarySoft }}>
          <Text accessibilityRole="summary" style={typography.label}>
            {t("features.catalog.addingFor", {
              meal: t(`meals.${(meal ?? mealSlotForTime()) as MealSlot}`),
              date: formatDate(date ?? todayInIstanbul(), lang),
            })}
          </Text>
        </Card>
      ) : null}
      <SearchBar
        testID="catalog-search"
        accessibilityLabel={t("features.catalog.searchLabel")}
        placeholder={t("catalog.searchPlaceholder")}
        value={query}
        onChangeText={setQuery}
        onCancel={() => setQuery("")}
      />
      <SegmentedControl<Segment>
        options={[
          { value: "all", label: t("catalog.all") },
          { value: "favorites", label: t("catalog.favorites") },
          { value: "mine", label: t("catalog.myFoods") },
        ]}
        value={segment}
        onChange={setSegment}
      />

      {showCategories ? (
        <View style={styles.section}>
          <Heading>{t("catalog.categories")}</Heading>
          <View style={styles.pills}>
            {CATEGORY_ORDER.map((c) => (
              <Chip key={c} label={categoryLabel(c, lang)} onPress={() => setCategory(c)} />
            ))}
          </View>
        </View>
      ) : null}

      {showCategories || segment === "mine" ? (
        <Card padded={false}>
          <Pressable
            testID="catalog-add-custom"
            accessibilityRole="button"
            accessibilityLabel={t("features.catalog.createCustom")}
            onPress={() => router.push("/custom-food")}
            style={styles.customCard}
          >
            <View style={styles.plusCircle}><Icon name="plus" size={22} color={colors.onPrimary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.customTitle}>{t("features.catalog.createCustom")}</Text>
              <Text style={typography.footnote}>{t("features.catalog.createCustomHint")}</Text>
            </View>
            <Icon name="chevronRight" size={20} color={colors.text} />
          </Pressable>
        </Card>
      ) : null}
      {showCategories && recentFoods.length > 0 ? (
        <View style={styles.section}>
          <Heading>{t("features.catalog.recentlyAdded")}</Heading>
          <FoodCard foods={recentFoods} onOpen={openFood} />
        </View>
      ) : null}

      {segment === "all" && !q && category ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("features.catalog.backToCategories")}
          onPress={() => setCategory(null)}
          style={styles.back}
        >
          <Icon name="chevronLeft" size={20} color={colors.text} />
          <Text style={styles.backText}>{t("features.catalog.backToCategories")}</Text>
        </Pressable>
      ) : null}

      {showCategories ? null : hasFoods ? (
        sections.map((section) =>
          section.foods.length === 0 ? null : (
            <View key={section.key} style={styles.section}>
              {section.title ? <Heading>{section.title}</Heading> : null}
              <FoodCard foods={section.foods} onOpen={openFood} />
            </View>
          ),
        )
      ) : (
        empty
      )}
    </Screen>
  );
}

function Heading({ children }: { children: string }) {
  return (
    <Text accessibilityRole="header" style={styles.heading}>
      {children}
    </Text>
  );
}

/** Rounded surface card of food rows with hairline dividers. */
function FoodCard({ foods, onOpen }: { foods: FoodView[]; onOpen: (food: FoodView) => void }) {
  return (
    <Card padded={false} style={{ gap: 0 }}>
      {foods.map((food, i) => (
        <View key={`${food.ref.kind}:${food.ref.id}`}>
          {i > 0 ? <Divider inset={spacing.lg} /> : null}
          <FoodRow food={food} onOpen={onOpen} />
        </View>
      ))}
    </Card>
  );
}

const FoodRow = memo(function FoodRow({ food, onOpen }: { food: FoodView; onOpen: (food: FoodView) => void }) {
  const { t, lang } = useI18n();
  const kind = food.isCustom ? t("catalog.kinds.custom") : t(`catalog.kinds.${food.ref.kind as "dish" | "food" | "packaged"}`);
  const serving = defaultServing(food, lang);
  const subtitle = [kind, food.brand, serving.label].filter(Boolean).join(" · ");
  const kcal = serving.kcal === null ? t("common.noData") : formatKcal(serving.kcal, lang);
  return (
    <Pressable
      accessibilityRole="button"
      accessible
      accessibilityLabel={`${food.name}, ${subtitle}, ${kcal}${food.isCustom ? `, ${t("features.catalog.addedByYouLabel")}` : ""}`}
      onPress={() => onOpen(food)}
      style={({ pressed }) => [styles.row, pressed ? { opacity: 0.6 } : null]}
    >
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{food.name}</Text>
        {food.isCustom ? (
          <View style={styles.rowSubtitle}>
            <AddedByYouPill />
            <Text style={typography.footnote}>{[food.brand, serving.label].filter(Boolean).join(" · ")}</Text>
          </View>
        ) : (
          <Text style={typography.footnote}>{subtitle}</Text>
        )}
      </View>
      <Text style={styles.rowKcal}>{kcal}</Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  customCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: spacing.md, minHeight: 72 },
  plusCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  customTitle: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 22, color: colors.text },
  section: { gap: spacing.sm, marginTop: spacing.xs },
  heading: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 25, color: colors.text, marginLeft: spacing.xs },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  back: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-start",
    paddingRight: spacing.md,
  },
  backText: { fontFamily: fonts.semibold, fontSize: 17, color: colors.text },
  row: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  rowSubtitle: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.xs },
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 21, color: colors.text },
  rowKcal: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 20, color: colors.text, fontVariant: ["tabular-nums"] },
});
