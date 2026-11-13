import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import { getCatalogItem } from "../src/catalog";
import { isFavorite, listEntriesByDate, saveCustomFood, type Db } from "../src/db";
import { FoodDetailScreen } from "../src/features/catalog/FoodDetailScreen";
import { createDb, renderWithApp } from "./helpers/catalogscreen-harness";
import { params, router, titles } from "./helpers/catalogscreen-router";

jest.mock("expo-router", () => require("./helpers/catalogscreen-router"));

let db: Db;
beforeEach(async () => {
  db = await createDb();
  params.current = {};
  titles.length = 0;
  jest.clearAllMocks();
});

describe("FoodDetailScreen", () => {
  it("shows a not-found state", async () => {
    params.current = { id: "nope" };
    await renderWithApp(<FoodDetailScreen />, db);
    expect(await screen.findByText(/Bu yemek bulunamadı/)).toBeTruthy();
  });

  it("shows values, source line and the title", async () => {
    params.current = { id: "mercimek-corbasi" };
    await renderWithApp(<FoodDetailScreen />, db);
    expect((await screen.findAllByText("Mercimek çorbası")).length).toBeGreaterThan(0);
    expect(titles).toContain("Mercimek çorbası");
    expect(screen.getByText("Standart tarif üzerinden hesaplanmıştır (USDA).")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Kaynaklar ve lisanslar"));
    expect(router.push).toHaveBeenCalledWith("/sources");
  });

  it("adds the dish by portion with the right snapshot and returns to Today", async () => {
    params.current = { id: "mercimek-corbasi", date: "2026-11-12", meal: "dinner" };
    const item = getCatalogItem("mercimek-corbasi")!;
    await renderWithApp(<FoodDetailScreen />, db);
    const quantity = await screen.findByLabelText("Miktar");
    await fireEvent.changeText(quantity, "2");
    await fireEvent.press(screen.getByRole("button", { name: "Günlüğe ekle" }));

    await waitFor(() => expect(router.dismissTo).toHaveBeenCalledWith({ pathname: "/", params: { date: "2026-11-12" } }));
    const entries = await listEntriesByDate(db, "2026-11-12");
    expect(entries).toHaveLength(1);
    const e = entries[0];
    expect(e.mealSlot).toBe("dinner");
    expect(e.food).toEqual({ kind: "dish", id: "mercimek-corbasi" });
    expect(e.foodName).toBe("Mercimek çorbası");
    expect(e.per100g).toEqual(item.per100g);
    expect(e.grams).toBe(item.portions[0].grams * 2);
    expect(e.portion).toEqual({
      id: item.portions[0].id,
      name: item.portions[0].nameTr,
      gramsPerUnit: item.portions[0].grams,
      quantity: 2,
    });
  });

  it("adds by grams and uses the English name in English", async () => {
    params.current = { id: "mercimek-corbasi", date: "2026-11-12", meal: "lunch" };
    await renderWithApp(<FoodDetailScreen />, db, "en");
    await fireEvent.press(await screen.findByRole("radio", { name: "Grams" }));
    await fireEvent.changeText(screen.getByDisplayValue("100"), "250");
    await fireEvent.press(screen.getByRole("button", { name: "Add to diary" }));
    await waitFor(() => expect(router.dismissTo).toHaveBeenCalled());
    const [e] = await listEntriesByDate(db, "2026-11-12");
    expect(e.grams).toBe(250);
    expect(e.portion).toBeNull();
    expect(e.foodName).toBe("Red lentil soup");
  });

  it("rejects an invalid amount without writing", async () => {
    params.current = { id: "mercimek-corbasi", date: "2026-11-12", meal: "lunch" };
    await renderWithApp(<FoodDetailScreen />, db);
    await fireEvent.changeText(await screen.findByLabelText("Miktar"), "abc");
    await fireEvent.press(screen.getByRole("button", { name: "Günlüğe ekle" }));
    expect(await screen.findByText(/0'dan büyük/)).toBeTruthy();
    expect(router.dismissTo).not.toHaveBeenCalled();
    expect(await listEntriesByDate(db, "2026-11-12")).toHaveLength(0);
  });

  it("keeps null nutrients null for a custom food and offers editing", async () => {
    const food = await saveCustomFood(db, {
      nameTr: "Bilinmeyen tatlı",
      per100g: { kcal: 300, protein: null, carbs: 40, fat: null },
      portions: [],
    });
    params.current = { id: food.id, date: "2026-11-12", meal: "snack" };
    await renderWithApp(<FoodDetailScreen />, db);
    expect((await screen.findAllByText("Veri yok")).length).toBeGreaterThanOrEqual(2);
    await fireEvent.press(screen.getByRole("button", { name: "Düzenle" }));
    expect(router.push).toHaveBeenCalledWith({ pathname: "/custom-food", params: { id: food.id } });

    await fireEvent.press(screen.getByRole("button", { name: "Günlüğe ekle" }));
    await waitFor(() => expect(router.dismissTo).toHaveBeenCalled());
    const [e] = await listEntriesByDate(db, "2026-11-12");
    expect(e.food).toEqual({ kind: "custom", id: food.id });
    expect(e.grams).toBe(100);
    expect(e.per100g).toEqual({ kcal: 300, protein: null, carbs: 40, fat: null });
  });

  it("toggles the favorite", async () => {
    params.current = { id: "mercimek-corbasi" };
    await renderWithApp(<FoodDetailScreen />, db);
    await fireEvent.press(await screen.findByLabelText("Favorilere ekle"));
    await waitFor(async () => expect(await isFavorite(db, { kind: "dish", id: "mercimek-corbasi" })).toBe(true));
    await fireEvent.press(await screen.findByLabelText("Favorilerden çıkar"));
    await waitFor(async () => expect(await isFavorite(db, { kind: "dish", id: "mercimek-corbasi" })).toBe(false));
  });
});
