import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { deleteCustomFood, getCustomFood, saveCustomFood, useDb } from "../../db";
import { MAX_AMOUNT, parseAmount } from "../../domain";
import { useI18n } from "../../i18n";
import { useAppState } from "../../state/AppState";
import type { CustomFood, CustomFoodKind, Nutrients, Portion } from "../../types";
import { Button, Card, EmptyState, Icon, IconButton, Loading, Screen, SectionTitle, SegmentedControl, TextField, colors, spacing, typography, useUnsavedChangesGuard } from "../../ui";
import { asString } from "./foodView";
import { portionToPer100g } from "./nutritionBasis";

type PortionDraft = { key: string; id: string | null; name: string; grams: string };
type Errors = Partial<Record<"name" | "brand" | "basisName" | "basisGrams" | "kcal" | "protein" | "carbs" | "fat" | "macroSum", string>> & {
  portions: Record<string, { name?: string; grams?: string }>;
};

export function CustomFoodScreen() {
  const { t } = useI18n();
  const db = useDb();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = asString(params.id);
  const [food, setFood] = useState<CustomFood | null | undefined>(id ? undefined : null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    getCustomFood(db, id)
      .then((f) => active && setFood(f))
      .catch(() => active && setFood(null));
    return () => {
      active = false;
    };
  }, [db, id]);

  if (id && food === undefined) {
    return (
      <Screen>
        <Loading label={t("common.loading")} />
      </Screen>
    );
  }
  if (id && food === null) {
    return (
      <Screen>
        <EmptyState message={t("features.catalog.notFound")} />
      </Screen>
    );
  }
  return <CustomFoodForm food={food ?? null} />;
}

/** "" -> null (unknown). "0" is a real zero. Otherwise parseAmount rules. */
function parseOptional(text: string): { ok: true; value: number | null } | { ok: false } {
  const s = text.trim();
  if (s === "") return { ok: true, value: null };
  if (/^0+(?:[.,]0*)?$/.test(s) || /^[.,]0+$/.test(s)) return { ok: true, value: 0 };
  const n = parseAmount(s);
  return n === null ? { ok: false } : { ok: true, value: n };
}

function CustomFoodForm({ food }: { food: CustomFood | null }) {
  const { t } = useI18n();
  const db = useDb();
  const { notifyDataChanged } = useAppState();
  const [name, setName] = useState(food?.nameTr ?? "");
  const [brand, setBrand] = useState(food?.brand ?? "");
  const [kind, setKind] = useState<CustomFoodKind>(food?.kind ?? "food");
  const [basis, setBasis] = useState<"hundred" | "portion">("hundred");
  const [basisName, setBasisName] = useState("");
  const [basisGrams, setBasisGrams] = useState("");
  const [kcal, setKcal] = useState(numText(food?.per100g.kcal));
  const [protein, setProtein] = useState(numText(food?.per100g.protein));
  const [carbs, setCarbs] = useState(numText(food?.per100g.carbs));
  const [fat, setFat] = useState(numText(food?.per100g.fat));
  const [portions, setPortions] = useState<PortionDraft[]>(
    () => food?.portions.map((p, i) => ({ key: `p${i}`, id: p.id, name: p.nameTr, grams: String(p.grams) })) ?? [],
  );
  const [nextKey, setNextKey] = useState(portions.length);
  const [errors, setErrors] = useState<Errors>({ portions: {} });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const [initialSnapshot] = useState(() => customFoodSnapshot({ name, brand, kind, basis, basisName, basisGrams, kcal, protein, carbs, fat, portions }));
  const isDirty = customFoodSnapshot({ name, brand, kind, basis, basisName, basisGrams, kcal, protein, carbs, fat, portions }) !== initialSnapshot;
  const allowLeave = useUnsavedChangesGuard(isDirty);

  const addPortionRow = () => {
    setPortions((list) => [...list, { key: `p${nextKey}`, id: null, name: "", grams: "" }]);
    setNextKey((n) => n + 1);
  };
  const updatePortion = (key: string, patch: Partial<PortionDraft>) =>
    setPortions((list) => list.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  const removePortion = (key: string) => setPortions((list) => list.filter((p) => p.key !== key));

  const save = async () => {
    const errs: Errors = { portions: {} };
    const trimmed = name.trim();
    if (!trimmed) errs.name = t("customFood.nameRequired");

    if (brand.length > 60) errs.brand = t("features.catalog.customForm.brandLength");
    const basisAmount = parseAmount(basisGrams);
    if (basis === "portion") {
      if (!basisName.trim()) errs.basisName = t("features.catalog.customForm.portionNameRequired");
      if (basisAmount === null || basisAmount > MAX_AMOUNT) errs.basisGrams = t(kind === "drink" ? "features.catalog.customForm.portionMlInvalid" : "features.catalog.customForm.portionGramsInvalid");
    }
    const scale = basis === "portion" && basisAmount !== null && basisAmount <= MAX_AMOUNT ? 100 / basisAmount : 1;
    let kcalValue: number | null = null;
    const k = parseOptional(kcal);
    if (kcal.trim() === "") errs.kcal = t("features.catalog.customForm.required");
    else if (!k.ok) errs.kcal = t("customFood.valueInvalid");
    else if (k.value === null || k.value < 0 || !Number.isFinite(k.value * scale) || k.value * scale > 900) errs.kcal = t(basis === "portion" ? "features.catalog.customForm.kcalPer100Range" : "features.catalog.customForm.kcalRange");
    else kcalValue = k.value;

    const macroValues: Record<"protein" | "carbs" | "fat", number | null> = { protein: null, carbs: null, fat: null };
    const macroInputs = { protein, carbs, fat } as const;
    for (const key of ["protein", "carbs", "fat"] as const) {
      const r = parseOptional(macroInputs[key]);
      if (macroInputs[key].trim() === "") errs[key] = t("features.catalog.customForm.required");
      else if (!r.ok) errs[key] = t("customFood.valueInvalid");
      else if (r.value !== null && (r.value < 0 || !Number.isFinite(r.value * scale) || r.value * scale > 100)) errs[key] = t(basis === "portion" ? "features.catalog.customForm.macroPer100Range" : "features.catalog.customForm.macroRange");
      else macroValues[key] = r.value;
    }
    if (!errs.protein && !errs.carbs && !errs.fat) {
      const sum = (macroValues.protein ?? 0) + (macroValues.carbs ?? 0) + (macroValues.fat ?? 0);
      if (sum * scale > 100.0001) errs.macroSum = t("features.catalog.customForm.macroSum");
    }

    const portionList: Portion[] = [];
    if (basis === "portion" && !errs.basisName && !errs.basisGrams && basisAmount !== null) {
      portionList.push({ id: `portion-${Date.now().toString(36)}-basis`, nameTr: basisName.trim(), nameEn: null, grams: basisAmount });
    }
    portions.forEach((p, i) => {
      const nm = p.name.trim();
      const gramsText = p.grams.trim();
      if (!nm && !gramsText) return; // empty row is ignored
      const row: { name?: string; grams?: string } = {};
      if (!nm) row.name = t("features.catalog.customForm.portionNameRequired");
      const g = parseAmount(gramsText);
      if (g === null || g > MAX_AMOUNT) row.grams = t(kind === "drink" ? "features.catalog.customForm.portionMlInvalid" : "features.catalog.customForm.portionGramsInvalid");
      if (row.name || row.grams) errs.portions[p.key] = row;
      else if (g !== null) portionList.push({ id: p.id ?? `portion-${Date.now().toString(36)}-${i}`, nameTr: nm, nameEn: null, grams: g });
    });

    setErrors(errs);
    const hasError =
      errs.name || errs.brand || errs.basisName || errs.basisGrams || errs.kcal || errs.protein || errs.carbs || errs.fat || errs.macroSum || Object.keys(errs.portions).length > 0;
    if (hasError || kcalValue === null) return;

    const entered: Nutrients = { kcal: kcalValue, ...macroValues };
    const per100g = basis === "portion" && basisAmount !== null ? portionToPer100g(entered, basisAmount) : entered;
    setSaving(true);
    setSaveError(false);
    try {
      await saveCustomFood(db, { id: food?.id, nameTr: trimmed, brand: brand.trim() || null, kind, per100g, portions: portionList });
      notifyDataChanged();
      allowLeave();
      router.back();
    } catch {
      setSaveError(true);
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!food) return;
    Alert.alert(t("features.catalog.customForm.deleteTitle"), t("customFood.deleteConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await deleteCustomFood(db, food.id);
              notifyDataChanged();
              allowLeave();
              // The detail screen of a deleted food would be empty, so leave both screens.
              router.dismissTo("/catalog");
            } catch {
              setSaveError(true);
            }
          })();
        },
      },
    ]);
  };

  return (
    <Screen
      edges={["top", "bottom"]}
      largeTitle={food ? t("customFood.edit") : t("features.catalog.customForm.title")}
      centerHeader
      subtitle={t("features.catalog.customForm.subtitle")}
      headerLeft={<IconButton icon="chevronLeft" accessibilityLabel={t("common.back")} onPress={() => router.back()} />}
      footer={<Button label={t("common.save")} onPress={save} loading={saving} />}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <Card>
        <TextField testID="custom-name" label={`${t("features.catalog.customForm.name")} *`} accessibilityLabel={t("customFood.name")} value={name} onChangeText={setName} error={errors.name} maxLength={80} />
        <TextField testID="custom-brand" label={t("features.catalog.customForm.brand")} placeholder={t("features.catalog.customForm.brandPlaceholder")} value={brand} onChangeText={setBrand} error={errors.brand} maxLength={60} />
        <View style={styles.grid}>
          <View style={styles.cell}>
            <Text style={typography.footnote}>{t("features.catalog.customForm.kind")}</Text>
            <SegmentedControl options={[{ value: "food", label: t("features.catalog.customForm.food") }, { value: "drink", label: t("features.catalog.customForm.drink") }]} value={kind} onChange={setKind} accessibilityLabel={t("features.catalog.customForm.kind")} />
          </View>
          <View style={styles.cell}>
            <Text style={typography.footnote}>{t("features.catalog.customForm.basis")}</Text>
            <SegmentedControl options={[{ value: "hundred", label: t(kind === "drink" ? "features.catalog.customForm.per100ml" : "features.catalog.customForm.per100g") }, { value: "portion", label: t("features.catalog.customForm.perPortion") }]} value={basis} onChange={setBasis} accessibilityLabel={t("features.catalog.customForm.basis")} />
          </View>
        </View>
        {kind === "drink" ? <Text style={typography.footnote}>{t("features.catalog.customForm.drinkHint")}</Text> : null}
        <Text style={typography.footnote}>{t("features.catalog.customForm.requiredLegend")}</Text>
        {basis === "portion" ? <>
          <TextField testID="custom-basis-name" label={`${t("features.catalog.customForm.basisPortionName")} *`} value={basisName} onChangeText={setBasisName} error={errors.basisName} />
          <TextField testID="custom-basis-grams" label={`${t(kind === "drink" ? "features.catalog.customForm.portionMl" : "features.catalog.customForm.portionGrams")} *`} value={basisGrams} onChangeText={setBasisGrams} keyboardType="decimal-pad" inputMode="decimal" suffix={kind === "drink" ? "ml" : "g"} error={errors.basisGrams} />
        </> : null}
      </Card>
      <Card>
        <SectionTitle>{t(basis === "portion" ? "features.catalog.customForm.nutritionPortion" : kind === "drink" ? "features.catalog.customForm.nutritionMl" : "features.catalog.customForm.nutritionGrams")}</SectionTitle>
        <View style={styles.grid}>
          {([
            ["kcal", kcal, setKcal],
            ["protein", protein, setProtein],
            ["carbs", carbs, setCarbs],
            ["fat", fat, setFat],
          ] as const).map(([key, value, onChangeText]) => (
            <View key={key} style={styles.cell}>
              <TextField
                testID={`custom-${key}`}
                label={`${t(`features.catalog.customForm.${key}`)} *`}
                accessibilityLabel={key === "kcal" ? `${t("macros.kcal")} (${t("units.kcal")})` : t(`features.catalog.customForm.${key}`)}
                value={value}
                onChangeText={onChangeText}
                keyboardType="decimal-pad"
                inputMode="decimal"
                error={errors[key] ?? (key === "fat" ? errors.macroSum : undefined)}
              />
            </View>
          ))}
        </View>
        <SectionTitle>{t("features.catalog.customForm.portions")}</SectionTitle>
        {portions.map((p, i) => (
          <Card key={p.key}>
            <TextField
              testID={`custom-portion-name-${i + 1}`}
              label={`${t("customFood.portionName")} ${i + 1}`}
              value={p.name}
              onChangeText={(v) => updatePortion(p.key, { name: v })}
              error={errors.portions[p.key]?.name}
            />
            <TextField
              testID={`custom-portion-grams-${i + 1}`}
              label={`${t(kind === "drink" ? "features.catalog.customForm.portionMl" : "customFood.portionGrams")} ${i + 1}`}
              value={p.grams}
              onChangeText={(v) => updatePortion(p.key, { grams: v })}
              keyboardType="decimal-pad"
              inputMode="decimal"
              suffix={kind === "drink" ? "ml" : "g"}
              error={errors.portions[p.key]?.grams}
            />
            <Button
              label={`${t("features.catalog.customForm.removePortion")} ${i + 1}`}
              variant="ghost"
              onPress={() => removePortion(p.key)}
            />
          </Card>
        ))}
        <Button label={t("features.catalog.customForm.addPortion")} variant="secondary" onPress={addPortionRow} />

      </Card>
      <Card style={{ borderWidth: 1, borderColor: colors.border }}>
        <View style={styles.note}>
          <Icon name="search" size={20} color={colors.text} />
          <Text style={[typography.footnote, { flex: 1, color: colors.text }]}>{t("features.catalog.customForm.labelHint")}</Text>
        </View>
      </Card>
      <Card style={{ backgroundColor: colors.primarySoft }}>
        <Text style={[typography.footnote, { color: colors.text }]}>{t("features.catalog.customForm.infoNote")}</Text>
      </Card>
      {food ? <Text style={typography.small}>{t("features.catalog.customForm.historyNote")}</Text> : null}
      {saveError ? (
        <Text accessibilityRole="alert" style={[typography.body, { color: colors.danger }]}>
          {t("features.catalog.customForm.saveFailed")}
        </Text>
      ) : null}
      {food ? <Button label={t("common.delete")} variant="danger" onPress={confirmDelete} /> : null}
    </Screen>
  );
}

function numText(v: number | null | undefined): string {
  return v === null || v === undefined ? "" : String(v);
}

/** Form text that the user can edit; row keys, ids and fully empty portion rows are not part of it. */
export function customFoodSnapshot(v: {
  name: string;
  brand?: string;
  kind?: CustomFoodKind;
  basis?: "hundred" | "portion";
  basisName?: string;
  basisGrams?: string;
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
  portions: PortionDraft[];
}): string {
  return JSON.stringify([v.name, v.brand ?? "", v.kind ?? "food", v.basis ?? "hundred", v.basisName ?? "", v.basisGrams ?? "", v.kcal, v.protein, v.carbs, v.fat, v.portions.filter((p) => p.name !== "" || p.grams !== "").map((p) => [p.name, p.grams])]);
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  cell: { flexGrow: 1, flexBasis: 145, minWidth: 0, gap: spacing.xs },
  note: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
});
