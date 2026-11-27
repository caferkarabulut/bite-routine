import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

import { addEntry, getCustomFood, listCustomFoods, listEntriesByDate, saveCustomFood, type Db } from "../src/db";
import { CustomFoodScreen } from "../src/features/catalog/CustomFoodScreen";
import { createDb, renderWithApp } from "./helpers/catalogscreen-harness";
import { params, router, titles } from "./helpers/catalogscreen-router";
import { attemptLeave, guard, resetGuard } from "./helpers/prevent-remove";

jest.mock("expo-router", () => require("./helpers/catalogscreen-router"));

let db: Db;
beforeEach(async () => {
  db = await createDb();
  params.current = {};
  jest.clearAllMocks();
});

const fill = async (label: string, value: string) => fireEvent.changeText(screen.getByLabelText(label), value);
const save = async () => fireEvent.press(screen.getByRole("button", { name: "Kaydet" }));

describe("CustomFoodScreen", () => {
  // A <Stack.Screen> inside the form re-sets the navigator options on every render; on an iOS modal
  // that froze the form (typing, taps and Save had no effect). Header options live in the route file.
  it("does not render Stack.Screen inside the form", async () => {
    titles.length = 0;
    await renderWithApp(<CustomFoodScreen />, db);
    await screen.findByLabelText("Yemek adı");
    expect(titles).toHaveLength(0);
  });

  it.each([
    ["tr", "Bu ürünü sen ekliyorsun. Değerler resmi olarak doğrulanmaz; listede “Senin eklediğin” diye görünür. Yalnız bu telefonda saklanır."],
    ["en", "You are adding this item yourself. Its values are not officially verified and it shows as “Added by you”. It is stored only on this phone."],
  ] as const)("explains the user-entered values before saving in %s", async (lang, note) => {
    await renderWithApp(<CustomFoodScreen />, db, lang);
    expect(await screen.findByText(note)).toBeTruthy();
  });

  it("validates the required fields and ranges", async () => {
    await renderWithApp(<CustomFoodScreen />, db);
    await screen.findByLabelText("Yemek adı");
    await save();
    expect(await screen.findByText("Bir ad gir.")).toBeTruthy();
    expect(screen.getAllByText("Bu alan gerekli.")).toHaveLength(4);

    await fill("Yemek adı", "Test");
    await fill("Kalori (kcal)", "901");
    await fill("Protein (g)", "101");
    await save();
    expect(await screen.findByText("Kalori 0 ile 900 arasında olmalı.")).toBeTruthy();
    expect(screen.getByText("0 ile 100 arasında bir sayı gir.")).toBeTruthy();

    await fill("Kalori (kcal)", "100");
    await fill("Protein (g)", "60");
    await fill("Karbonhidrat (g)", "30");
    await fill("Yağ (g)", "20");
    await save();
    expect(await screen.findByText(/toplamı 100 g/)).toBeTruthy();

    await fill("Yağ (g)", "");
    await fill("Karbonhidrat (g)", "x");
    await save();
    expect(await screen.findByText("Geçerli bir sayı gir.")).toBeTruthy();
    expect(await listCustomFoods(db)).toHaveLength(0);
    expect(router.back).not.toHaveBeenCalled();
  });

  it("creates a food with all required macros and a portion", async () => {
    await renderWithApp(<CustomFoodScreen />, db);
    await fill("Yemek adı", "  Evde granola ");
    await fill("Kalori (kcal)", "412,5");
    await fill("Karbonhidrat (g)", "0");
    await fill("Yağ (g)", "0");
    await fill("Protein (g)", "0");
    await fireEvent.press(screen.getByRole("button", { name: "+ Porsiyon ekle" }));
    await fill("Porsiyon adı (isteğe bağlı) 1", "1 kase");
    await fill("Porsiyon gramı 1", "45");
    await save();

    await waitFor(() => expect(router.back).toHaveBeenCalled());
    const [food] = await listCustomFoods(db);
    expect(food.nameTr).toBe("Evde granola");
    expect(food.per100g).toEqual({ kcal: 412.5, protein: 0, carbs: 0, fat: 0 });
    expect(food.portions).toHaveLength(1);
    expect(food.portions[0]).toMatchObject({ nameTr: "1 kase", nameEn: null, grams: 45 });
  });

  it("flags an incomplete portion row and removes rows", async () => {
    await renderWithApp(<CustomFoodScreen />, db);
    await fill("Yemek adı", "Test");
    await fill("Kalori (kcal)", "100");
    await fill("Protein (g)", "0");
    await fill("Karbonhidrat (g)", "0");
    await fill("Yağ (g)", "0");
    await fireEvent.press(screen.getByRole("button", { name: "+ Porsiyon ekle" }));
    await fill("Porsiyon adı (isteğe bağlı) 1", "Dilim");
    await save();
    expect(await screen.findByText(/Gram 0'dan büyük/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Porsiyonu kaldır 1" }));
    expect(screen.queryByLabelText("Porsiyon gramı 1")).toBeNull();
    await save();
    await waitFor(() => expect(router.back).toHaveBeenCalled());
  });

  it("edits an existing food", async () => {
    const food = await saveCustomFood(db, {
      nameTr: "Börek",
      per100g: { kcal: 250, protein: 8, carbs: null, fat: null },
      portions: [{ id: "p1", nameTr: "Dilim", nameEn: null, grams: 80 }],
    });
    params.current = { id: food.id };
    await renderWithApp(<CustomFoodScreen />, db);
    expect(await screen.findByDisplayValue("Börek")).toBeTruthy();
    expect(screen.getByDisplayValue("250")).toBeTruthy();
    expect(screen.getByDisplayValue("80")).toBeTruthy();
    await fill("Kalori (kcal)", "260");
    await fill("Karbonhidrat (g)", "0");
    await fill("Yağ (g)", "0");
    await save();
    await waitFor(() => expect(router.back).toHaveBeenCalled());
    const saved = await getCustomFood(db, food.id);
    expect(saved?.per100g).toEqual({ kcal: 260, protein: 8, carbs: 0, fat: 0 });
    expect(saved?.portions[0].id).toBe("p1");
  });

  it("stores a branded drink from portion values and makes its entered portion first", async () => {
    await renderWithApp(<CustomFoodScreen />, db);
    await fill("Yemek adı", " Granola içeceği ");
    await fireEvent.changeText(screen.getByTestId("custom-brand"), " Marka ");
    await fireEvent.press(screen.getByRole("radio", { name: "İçecek" }));
    expect(screen.getByRole("radio", { name: "100 ml" })).toBeTruthy();
    expect(screen.getByText(/İçecekte değerleri 100 ml/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("radio", { name: "Porsiyon" }));
    await fireEvent.changeText(screen.getByTestId("custom-basis-name"), "1 kutu");
    await fireEvent.changeText(screen.getByTestId("custom-basis-grams"), "40");
    await fill("Kalori (kcal)", "190");
    await fill("Protein (g)", "4,4");
    await fill("Karbonhidrat (g)", "23,2");
    await fill("Yağ (g)", "8");
    await fireEvent.press(screen.getByRole("button", { name: "+ Porsiyon ekle" }));
    await fill("Porsiyon adı (isteğe bağlı) 1", "Bardak");
    await fireEvent.changeText(screen.getByTestId("custom-portion-grams-1"), "200");
    await save();
    await waitFor(() => expect(router.back).toHaveBeenCalled());
    const [food] = await listCustomFoods(db);
    expect(food).toMatchObject({ brand: "Marka", kind: "drink", per100g: { kcal: 475, protein: 11, carbs: 58, fat: 20 } });
    expect(food.portions.map((p) => [p.nameTr, p.grams])).toEqual([["1 kutu", 40], ["Bardak", 200]]);
  });

  it("requires the basis portion and validates ranges after converting to per 100 g", async () => {
    await renderWithApp(<CustomFoodScreen />, db);
    await fill("Yemek adı", "Test");
    await fireEvent.press(screen.getByRole("radio", { name: "Porsiyon" }));
    await fill("Kalori (kcal)", "190");
    await fill("Protein (g)", "10");
    await fill("Karbonhidrat (g)", "20");
    await fill("Yağ (g)", "10");
    await save();
    expect(screen.getByText("Porsiyon için bir ad gir.")).toBeTruthy();
    expect(screen.getByText(/Gram 0'dan büyük/)).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId("custom-basis-name"), "Dilim");
    await fireEvent.changeText(screen.getByTestId("custom-basis-grams"), "10");
    await save();
    expect(screen.getByText("100 g/ml karşılığı enerji 0 ile 900 kcal arasında olmalı.")).toBeTruthy();
    expect(screen.getByText("100 g/ml karşılığı makro değeri 0 ile 100 g arasında olmalı.")).toBeTruthy();
    expect(await listCustomFoods(db)).toHaveLength(0);
  });

  it("preserves brand, kind and the first portion while editing stored per-100 values", async () => {
    const food = await saveCustomFood(db, { nameTr: "Ayran", brand: "Marka", kind: "drink", per100g: { kcal: 40, protein: 2, carbs: 4, fat: 1 }, portions: [{ id: "glass", nameTr: "Bardak", nameEn: null, grams: 200 }] });
    params.current = { id: food.id };
    await renderWithApp(<CustomFoodScreen />, db);
    await screen.findByDisplayValue("Ayran");
    expect(screen.getByRole("radio", { name: "100 ml" }).props.accessibilityState.checked).toBe(true);
    expect(screen.getByTestId("custom-brand").props.value).toBe("Marka");
    await fill("Kalori (kcal)", "42");
    await save();
    await waitFor(() => expect(router.back).toHaveBeenCalled());
    expect(await getCustomFood(db, food.id)).toMatchObject({ brand: "Marka", kind: "drink", per100g: { kcal: 42 }, portions: food.portions });
  });

  it("deletes after confirmation and keeps past diary entries", async () => {
    const food = await saveCustomFood(db, {
      nameTr: "Börek",
      per100g: { kcal: 250, protein: null, carbs: null, fat: null },
      portions: [],
    });
    await addEntry(db, {
      date: "2026-11-12",
      mealSlot: "lunch",
      food: { kind: "custom", id: food.id },
      foodName: "Börek",
      grams: 100,
      portion: null,
      per100g: food.per100g,
    });
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    params.current = { id: food.id };
    await renderWithApp(<CustomFoodScreen />, db);
    await fireEvent.press(await screen.findByRole("button", { name: "Sil" }));
    expect(alert).toHaveBeenCalledTimes(1);
    expect(await getCustomFood(db, food.id)).not.toBeNull();

    const buttons = alert.mock.calls[0][2]!;
    await buttons.find((b) => b.style === "destructive")!.onPress!();
    await waitFor(() => expect(router.dismissTo).toHaveBeenCalledWith("/catalog"));
    expect(await getCustomFood(db, food.id)).toBeNull();
    expect(await listEntriesByDate(db, "2026-11-12")).toHaveLength(1);
    alert.mockRestore();
  });

  it("shows not-found for an unknown id", async () => {
    params.current = { id: "custom-missing" };
    await renderWithApp(<CustomFoodScreen />, db);
    expect(await screen.findByText(/bulunamadı/)).toBeTruthy();
    // The modal has no native header, so the screen draws its own back button.
    fireEvent.press(screen.getByLabelText("Geri"));
    expect(router.back).toHaveBeenCalled();
  });

  describe("unsaved changes guard", () => {
    beforeEach(() => resetGuard());

    it("is clean until something changes, and clean again when the edit is reverted", async () => {
      await renderWithApp(<CustomFoodScreen />, db);
      await screen.findByLabelText("Yemek adı");
      expect(guard.active).toBe(false);
      await fill("Yemek adı", "Börek");
      expect(guard.active).toBe(true);
      await fill("Yemek adı", "");
      expect(guard.active).toBe(false);
      expect(attemptLeave()).toBe(true);
    });

    it.each(["brand", "kind", "basis", "basisName", "basisGrams"])("guards changes to %s", async (field) => {
      await renderWithApp(<CustomFoodScreen />, db);
      await screen.findByTestId("custom-name");
      if (field === "brand") await fireEvent.changeText(screen.getByTestId("custom-brand"), "Marka");
      else if (field === "kind") await fireEvent.press(screen.getByRole("radio", { name: "İçecek" }));
      else {
        await fireEvent.press(screen.getByRole("radio", { name: "Porsiyon" }));
        if (field === "basisName") await fireEvent.changeText(screen.getByTestId("custom-basis-name"), "Kase");
        if (field === "basisGrams") await fireEvent.changeText(screen.getByTestId("custom-basis-grams"), "40");
      }
      expect(guard.active).toBe(true);
    });

    it("counts a portion row as a change", async () => {
      await renderWithApp(<CustomFoodScreen />, db);
      await screen.findByLabelText("Yemek adı");
      await fireEvent.press(screen.getByRole("button", { name: "+ Porsiyon ekle" }));
      expect(guard.active).toBe(false); // an empty row has no text yet
      await fill("Porsiyon gramı 1", "50");
      expect(guard.active).toBe(true);
    });

    it("compares an existing food against its stored values", async () => {
      const food = await saveCustomFood(db, {
        nameTr: "Börek",
        per100g: { kcal: 250, protein: 8, carbs: null, fat: null },
        portions: [{ id: "p1", nameTr: "Dilim", nameEn: null, grams: 80 }],
      });
      params.current = { id: food.id };
      await renderWithApp(<CustomFoodScreen />, db);
      await screen.findByDisplayValue("Börek");
      expect(guard.active).toBe(false);
      await fill("Kalori (kcal)", "260");
      expect(guard.active).toBe(true);
      await fill("Kalori (kcal)", "250");
      expect(guard.active).toBe(false);
    });

    it("lets the redirect after a successful save through", async () => {
      await renderWithApp(<CustomFoodScreen />, db);
      await fill("Yemek adı", "Çorba");
      await fill("Kalori (kcal)", "50");
      await fill("Protein (g)", "0");
      await fill("Karbonhidrat (g)", "0");
      await fill("Yağ (g)", "0");
      expect(guard.active).toBe(true);
      await save();
      await waitFor(() => expect(router.back).toHaveBeenCalled());
      expect(guard.disable).toHaveBeenCalled();
      expect(guard.disable.mock.invocationCallOrder[0]).toBeLessThan((router.back as jest.Mock).mock.invocationCallOrder[0]);
    });
  });
});
