import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

import { addEntry, getCustomFood, listCustomFoods, listEntriesByDate, saveCustomFood, type Db } from "../src/db";
import { CustomFoodScreen } from "../src/features/catalog/CustomFoodScreen";
import { createDb, renderWithApp } from "./helpers/catalogscreen-harness";
import { params, router } from "./helpers/catalogscreen-router";
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
  it("validates the required fields and ranges", async () => {
    await renderWithApp(<CustomFoodScreen />, db);
    await screen.findByLabelText("Yemek adı");
    await save();
    expect(await screen.findByText("Bir ad gir.")).toBeTruthy();
    expect(screen.getByText("Bu alan gerekli.")).toBeTruthy();

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

  it("creates a food with null macros and a portion", async () => {
    await renderWithApp(<CustomFoodScreen />, db);
    await fill("Yemek adı", "  Evde granola ");
    await fill("Kalori (kcal)", "412,5");
    await fill("Protein (g)", "0");
    await fireEvent.press(screen.getByRole("button", { name: "+ Porsiyon ekle" }));
    await fill("Porsiyon adı (isteğe bağlı) 1", "1 kase");
    await fill("Porsiyon gramı 1", "45");
    await save();

    await waitFor(() => expect(router.back).toHaveBeenCalled());
    const [food] = await listCustomFoods(db);
    expect(food.nameTr).toBe("Evde granola");
    expect(food.per100g).toEqual({ kcal: 412.5, protein: 0, carbs: null, fat: null });
    expect(food.portions).toHaveLength(1);
    expect(food.portions[0]).toMatchObject({ nameTr: "1 kase", nameEn: null, grams: 45 });
  });

  it("flags an incomplete portion row and removes rows", async () => {
    await renderWithApp(<CustomFoodScreen />, db);
    await fill("Yemek adı", "Test");
    await fill("Kalori (kcal)", "100");
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
    await save();
    await waitFor(() => expect(router.back).toHaveBeenCalled());
    const saved = await getCustomFood(db, food.id);
    expect(saved?.per100g).toEqual({ kcal: 260, protein: 8, carbs: null, fat: null });
    expect(saved?.portions[0].id).toBe("p1");
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
      expect(guard.active).toBe(true);
      await save();
      await waitFor(() => expect(router.back).toHaveBeenCalled());
      expect(guard.disable).toHaveBeenCalled();
      expect(guard.disable.mock.invocationCallOrder[0]).toBeLessThan((router.back as jest.Mock).mock.invocationCallOrder[0]);
    });
  });
});
