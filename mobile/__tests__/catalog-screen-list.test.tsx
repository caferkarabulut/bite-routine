import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import { addFavorite, saveCustomFood, type Db } from "../src/db";
import { CatalogScreen } from "../src/features/catalog/CatalogScreen";
import { createDb, renderWithApp } from "./helpers/catalogscreen-harness";
import { params, router } from "./helpers/catalogscreen-router";

jest.mock("expo-router", () => require("./helpers/catalogscreen-router"));

let db: Db;
beforeEach(async () => {
  db = await createDb();
  params.current = {};
  jest.clearAllMocks();
});

async function type(text: string) {
  await fireEvent.changeText(screen.getByLabelText("Katalogda ara"), text);
}

describe("CatalogScreen", () => {
  it("lists categories with an empty query and browses a category", async () => {
    await renderWithApp(<CatalogScreen />, db);
    expect(await screen.findByText("Çorbalar")).toBeTruthy();
    await fireEvent.press(screen.getByText("Çorbalar"));
    expect(await screen.findByText("Mercimek çorbası")).toBeTruthy();
    await fireEvent.press(screen.getByText("‹ Tüm kategoriler"));
    expect(await screen.findByText("Çorbalar")).toBeTruthy();
  });

  it("searches the catalog (debounced) and lists my foods first under a header", async () => {
    await saveCustomFood(db, {
      nameTr: "Mercimek köftem",
      per100g: { kcal: 150, protein: null, carbs: null, fat: null },
      portions: [],
    });
    await renderWithApp(<CatalogScreen />, db);
    await screen.findByText("Çorbalar");
    await type("MERCİMEK");
    expect(await screen.findByText("Mercimek çorbası")).toBeTruthy();
    expect(screen.getAllByRole("header").map((h) => h.props.children)).toContain("Yemeklerim");
    const labels = screen.getAllByRole("button").map((b) => String(b.props.accessibilityLabel));
    const mineAt = labels.findIndex((l) => l.startsWith("Mercimek köftem"));
    const soupAt = labels.findIndex((l) => l.startsWith("Mercimek çorbası"));
    expect(mineAt).toBeGreaterThan(-1);
    expect(soupAt).toBeGreaterThan(mineAt);
  });

  it("shows a no-results state", async () => {
    await renderWithApp(<CatalogScreen />, db);
    await screen.findByText("Çorbalar");
    await type("zzzqqq");
    expect(await screen.findByText(/Sonuç bulunamadı/)).toBeTruthy();
  });

  it("switches to favorites and my foods", async () => {
    const mine = await saveCustomFood(db, {
      nameTr: "Annemin böreği",
      per100g: { kcal: 250, protein: 8, carbs: 30, fat: 10 },
      portions: [],
    });
    await addFavorite(db, { kind: "dish", id: "mercimek-corbasi" });
    await addFavorite(db, { kind: "custom", id: mine.id });
    await renderWithApp(<CatalogScreen />, db);
    await screen.findByText("Çorbalar");

    await fireEvent.press(screen.getByLabelText("Favoriler"));
    expect(await screen.findByText("Mercimek çorbası")).toBeTruthy();
    expect(screen.getByText("Annemin böreği")).toBeTruthy();

    await fireEvent.press(screen.getByLabelText("Yemeklerim"));
    await waitFor(() => expect(screen.queryByText("Mercimek çorbası")).toBeNull());
    expect(screen.getByText("Annemin böreği")).toBeTruthy();
  });

  it("shows empty favorites", async () => {
    await renderWithApp(<CatalogScreen />, db);
    await fireEvent.press(await screen.findByLabelText("Favoriler"));
    expect(await screen.findByText(/Henüz favorin yok/)).toBeTruthy();
  });

  it("shows the banner and passes date and meal to the detail screen", async () => {
    params.current = { date: "2026-11-13", meal: "breakfast" };
    await renderWithApp(<CatalogScreen />, db);
    expect(await screen.findByText("Kahvaltı · 13 Kasım Cuma için ekliyorsun")).toBeTruthy();
    await type("mercimek");
    await fireEvent.press(await screen.findByText("Mercimek çorbası"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/food/[id]",
      params: { id: "mercimek-corbasi", date: "2026-11-13", meal: "breakfast" },
    });
  });

  it("opens a custom food and the create form", async () => {
    const mine = await saveCustomFood(db, {
      nameTr: "Evde granola",
      per100g: { kcal: 400, protein: null, carbs: null, fat: null },
      portions: [],
    });
    await renderWithApp(<CatalogScreen />, db);
    await fireEvent.press(await screen.findByLabelText("Yemeklerim"));
    await fireEvent.press(await screen.findByText("Evde granola"));
    expect(router.push).toHaveBeenCalledWith({ pathname: "/food/[id]", params: { id: mine.id } });
    await fireEvent.press(screen.getByLabelText("+ Kendi yemeğini oluştur"));
    expect(router.push).toHaveBeenCalledWith("/custom-food");
  });
});
