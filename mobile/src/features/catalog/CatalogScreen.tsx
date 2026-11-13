import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Text, View } from "react-native";

import { CATEGORY_ORDER, categoryLabel, foldTr, getCatalogItem, searchCatalog } from "../../catalog";
import { listCustomFoods, listFavorites, useDb } from "../../db";
import { todayInIstanbul } from "../../domain";
import { formatDate, formatKcal, useI18n } from "../../i18n";
import { useAppState } from "../../state/AppState";
import type { CustomFood, FoodRef, MealSlot } from "../../types";
import { Button, Card, ChoiceChips, Divider, EmptyState, ListRow, TextField, colors, spacing, typography, mealSlotForTime } from "../../ui";
import { asLocalDate, asMealSlot, viewOfCatalogItem, viewOfCustomFood, type FoodView } from "./foodView";

type Segment = "all" | "favorites" | "mine";

type Row =
  | { type: "header"; key: string; title: string }
  | { type: "category"; key: string; category: string; title: string }
  | { type: "back"; key: string; title: string }
  | { type: "food"; key: string; food: FoodView };

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
  const [favorites, setFavorites] = useState<FoodRef[]>([]);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 150);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    let active = true;
    Promise.all([listCustomFoods(db), listFavorites(db)])
      .then(([foods, favs]) => {
        if (!active) return;
        setCustomFoods(foods);
        setFavorites(favs);
      })
      .catch(() => {
        // Lists stay empty; the catalog itself still works.
      });
    return () => {
      active = false;
    };
  }, [db, dataVersion]);

  const q = foldTr(debounced);

  const rows = useMemo<Row[]>(() => {
    const matchingCustom = customFoods
      .filter((f) => !q || foldTr(f.nameTr).includes(q))
      .map<Row>((f) => ({ type: "food", key: f.id, food: viewOfCustomFood(f) }));

    if (segment === "mine") return matchingCustom;

    if (segment === "favorites") {
      const out: Row[] = [];
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
        out.push({ type: "food", key: `${ref.kind}:${ref.id}`, food });
      }
      return out;
    }

    // segment "all"
    if (q) {
      const out: Row[] = [];
      if (matchingCustom.length > 0) {
        out.push({ type: "header", key: "h-mine", title: t("catalog.myFoods") }, ...matchingCustom);
      }
      const found = searchCatalog(debounced, { limit: SEARCH_LIMIT });
      if (matchingCustom.length > 0 && found.length > 0) {
        out.push({ type: "header", key: "h-catalog", title: t("catalog.title") });
      }
      for (const item of found) out.push({ type: "food", key: item.id, food: viewOfCatalogItem(item, lang) });
      return out;
    }
    if (category) {
      const out: Row[] = [{ type: "back", key: "back", title: t("features.catalog.backToCategories") }];
      for (const item of searchCatalog("", { category, limit: CATEGORY_LIMIT })) {
        out.push({ type: "food", key: item.id, food: viewOfCatalogItem(item, lang) });
      }
      return out;
    }
    return [
      { type: "header", key: "h-categories", title: t("catalog.categories") },
      ...CATEGORY_ORDER.map<Row>((c) => ({
        type: "category",
        key: `cat:${c}`,
        category: c,
        title: categoryLabel(c, lang),
      })),
    ];
  }, [segment, q, debounced, category, customFoods, favorites, lang, t]);

  const openFood = (food: FoodView) => {
    router.push({
      pathname: "/food/[id]",
      params: { id: food.ref.id, ...(date ? { date } : {}), ...(meal ? { meal } : {}) },
    });
  };

  const renderItem = ({ item }: { item: Row }) => {
    switch (item.type) {
      case "header":
        return (
          <Text accessibilityRole="header" style={[typography.label, { paddingTop: spacing.md }]}>
            {item.title}
          </Text>
        );
      case "category":
        return (
          <ListRow title={item.title} right="›" onPress={() => setCategory(item.category)} />
        );
      case "back":
        return <ListRow title={`‹ ${item.title}`} onPress={() => setCategory(null)} />;
      case "food": {
        const f = item.food;
        const kindLabel = f.isCustom ? t("catalog.kinds.custom") : t(`catalog.kinds.${f.ref.kind as "dish" | "food" | "packaged"}`);
        const subtitle = [kindLabel, f.brand].filter(Boolean).join(" · ");
        return (
          <ListRow
            title={f.name}
            subtitle={subtitle}
            right={f.per100g.kcal === null ? t("common.noData") : `${formatKcal(f.per100g.kcal, lang)}\n${t("catalog.per100g")}`}
            onPress={() => openFood(f)}
          />
        );
      }
    }
  };

  const showFilterHint = segment === "all" && !q && !category;

  const header = (
    <View style={{ gap: spacing.md, paddingBottom: spacing.sm }}>
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
      <TextField
        label={t("features.catalog.searchLabel")}
        placeholder={t("catalog.searchPlaceholder")}
        value={query}
        onChangeText={setQuery}
        returnKeyType="search"
        autoCorrect={false}
        clearButtonMode="while-editing"
      />
      <ChoiceChips<Segment>
        options={[
          { value: "all", label: t("catalog.all") },
          { value: "favorites", label: t("catalog.favorites") },
          { value: "mine", label: t("catalog.myFoods") },
        ]}
        value={segment}
        onChange={setSegment}
      />
      <Button label={t("features.catalog.createCustom")} variant="secondary" onPress={() => router.push("/custom-food")} />
      {showFilterHint ? null : <Divider />}
    </View>
  );

  const empty = (() => {
    if (segment === "favorites" && !q) return <EmptyState message={t("catalog.noFavorites")} />;
    if (segment === "mine" && !q) {
      return <EmptyState message={`${t("features.catalog.noMyFoods")}\n${t("features.catalog.noMyFoodsHint")}`} />;
    }
    return <EmptyState message={`${t("catalog.noResults")}\n${t("catalog.noResultsHint")}`} />;
  })();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.key}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: spacing.lg, flexGrow: 1 }}
        initialNumToRender={20}
        windowSize={7}
      />
    </View>
  );
}
