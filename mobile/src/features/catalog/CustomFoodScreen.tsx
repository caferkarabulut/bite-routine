import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";

import { deleteCustomFood, getCustomFood, saveCustomFood, useDb } from "../../db";
import { MAX_AMOUNT, parseAmount } from "../../domain";
import { useI18n } from "../../i18n";
import { useAppState } from "../../state/AppState";
import type { CustomFood, Nutrients, Portion } from "../../types";
import { Button, Card, EmptyState, Loading, Screen, SectionTitle, TextField, colors, spacing, typography } from "../../ui";
import { asString } from "./foodView";

type PortionDraft = { key: string; id: string | null; name: string; grams: string };
type Errors = Partial<Record<"name" | "kcal" | "protein" | "carbs" | "fat" | "macroSum", string>> & {
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

    let kcalValue: number | null = null;
    const k = parseOptional(kcal);
    if (kcal.trim() === "") errs.kcal = t("features.catalog.customForm.required");
    else if (!k.ok) errs.kcal = t("customFood.valueInvalid");
    else if (k.value === null || k.value < 0 || k.value > 900) errs.kcal = t("features.catalog.customForm.kcalRange");
    else kcalValue = k.value;

    const macroValues: Record<"protein" | "carbs" | "fat", number | null> = { protein: null, carbs: null, fat: null };
    const macroInputs = { protein, carbs, fat } as const;
    for (const key of ["protein", "carbs", "fat"] as const) {
      const r = parseOptional(macroInputs[key]);
      if (!r.ok) errs[key] = t("customFood.valueInvalid");
      else if (r.value !== null && (r.value < 0 || r.value > 100)) errs[key] = t("features.catalog.customForm.macroRange");
      else macroValues[key] = r.value;
    }
    if (!errs.protein && !errs.carbs && !errs.fat) {
      const sum = (macroValues.protein ?? 0) + (macroValues.carbs ?? 0) + (macroValues.fat ?? 0);
      if (sum > 100.0001) errs.macroSum = t("features.catalog.customForm.macroSum");
    }

    const portionList: Portion[] = [];
    portions.forEach((p, i) => {
      const nm = p.name.trim();
      const gramsText = p.grams.trim();
      if (!nm && !gramsText) return; // empty row is ignored
      const row: { name?: string; grams?: string } = {};
      if (!nm) row.name = t("features.catalog.customForm.portionNameRequired");
      const g = parseAmount(gramsText);
      if (g === null || g > MAX_AMOUNT) row.grams = t("features.catalog.customForm.portionGramsInvalid");
      if (row.name || row.grams) errs.portions[p.key] = row;
      else if (g !== null) portionList.push({ id: p.id ?? `portion-${Date.now().toString(36)}-${i}`, nameTr: nm, nameEn: null, grams: g });
    });

    setErrors(errs);
    const hasError =
      errs.name || errs.kcal || errs.protein || errs.carbs || errs.fat || errs.macroSum || Object.keys(errs.portions).length > 0;
    if (hasError || kcalValue === null) return;

    const per100g: Nutrients = { kcal: kcalValue, ...macroValues };
    setSaving(true);
    setSaveError(false);
    try {
      await saveCustomFood(db, { id: food?.id, nameTr: trimmed, per100g, portions: portionList });
      notifyDataChanged();
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
    <Screen>
      <Stack.Screen options={{ title: food ? t("customFood.edit") : t("customFood.new") }} />
      <TextField label={t("customFood.name")} value={name} onChangeText={setName} error={errors.name} maxLength={80} />
      <SectionTitle>{t("customFood.per100g")}</SectionTitle>
      <Text style={typography.muted}>{t("customFood.optionalHint")}</Text>
      <TextField
        label={t("features.catalog.customForm.kcal")}
        value={kcal}
        onChangeText={setKcal}
        keyboardType="decimal-pad"
        inputMode="decimal"
        error={errors.kcal}
      />
      <TextField
        label={t("features.catalog.customForm.protein")}
        value={protein}
        onChangeText={setProtein}
        keyboardType="decimal-pad"
        inputMode="decimal"
        error={errors.protein}
      />
      <TextField
        label={t("features.catalog.customForm.carbs")}
        value={carbs}
        onChangeText={setCarbs}
        keyboardType="decimal-pad"
        inputMode="decimal"
        error={errors.carbs}
      />
      <TextField
        label={t("features.catalog.customForm.fat")}
        value={fat}
        onChangeText={setFat}
        keyboardType="decimal-pad"
        inputMode="decimal"
        error={errors.fat ?? errors.macroSum}
      />

      <SectionTitle>{t("features.catalog.customForm.portions")}</SectionTitle>
      {portions.map((p, i) => (
        <Card key={p.key}>
          <TextField
            label={`${t("customFood.portionName")} ${i + 1}`}
            value={p.name}
            onChangeText={(v) => updatePortion(p.key, { name: v })}
            error={errors.portions[p.key]?.name}
          />
          <TextField
            label={`${t("customFood.portionGrams")} ${i + 1}`}
            value={p.grams}
            onChangeText={(v) => updatePortion(p.key, { grams: v })}
            keyboardType="decimal-pad"
            inputMode="decimal"
            suffix="g"
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

      <View style={{ gap: spacing.xs }}>
        <Text style={typography.small}>{t("customFood.onDeviceOnly")}</Text>
        <Text style={typography.small}>{t("features.catalog.customForm.historyNote")}</Text>
      </View>
      {saveError ? (
        <Text accessibilityRole="alert" style={[typography.body, { color: colors.danger }]}>
          {t("features.catalog.customForm.saveFailed")}
        </Text>
      ) : null}
      <Button label={t("common.save")} onPress={save} loading={saving} />
      {food ? <Button label={t("common.delete")} variant="danger" onPress={confirmDelete} /> : null}
    </Screen>
  );
}

function numText(v: number | null | undefined): string {
  return v === null || v === undefined ? "" : String(v);
}
