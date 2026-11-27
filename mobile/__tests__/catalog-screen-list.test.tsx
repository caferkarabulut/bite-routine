import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import { addEntry, addFavorite, saveCustomFood, type Db } from "../src/db";
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
    await fireEvent.press(screen.getByLabelText("Tüm kategoriler"));
    expect(await screen.findByText("Çorbalar")).toBeTruthy();
  });

  it("shows categories, the add card, then recents and forwards the add context", async () => {
    const custom = await saveCustomFood(db, { nameTr: "Ayranım", brand: "Markam", kind: "drink", per100g: { kcal: 40, protein: 2, carbs: 4, fat: 1 }, portions: [] });
    for (const ref of [{ kind: "dish" as const, id: "mercimek-corbasi" }, { kind: "custom" as const, id: custom.id }, { kind: "dish" as const, id: "removed" }]) {
      await addEntry(db, { date: "2026-11-27", mealSlot: "lunch", food: ref, foodName: "Snapshot", grams: 100, portion: null, per100g: custom.per100g });
    }
    params.current = { date: "2026-11-27", meal: "dinner" };
    await renderWithApp(<CatalogScreen />, db);
    expect(await screen.findByText("Ayranım")).toBeTruthy();
    expect(screen.getByText("Markam · 100 ml")).toBeTruthy();
    expect(screen.getByText("Son eklenenler")).toBeTruthy();
    expect(screen.queryByText("Snapshot")).toBeNull();
    const buttons = screen.getAllByRole("button").map((b) => String(b.props.accessibilityLabel));
    expect(buttons.indexOf("Kendi ürününü ekle")).toBeLessThan(buttons.findIndex((label) => label.startsWith("Ayranım,")));
    await fireEvent.press(screen.getByText("Ayranım"));
    expect(router.push).toHaveBeenCalledWith({ pathname: "/food/[id]", params: { id: custom.id, date: "2026-11-27", meal: "dinner" } });
    await fireEvent.press(screen.getByRole("radio", { name: "Favoriler" }));
    expect(screen.queryByText("Son eklenenler")).toBeNull();
  });

  it("hides recents when nothing has been logged", async () => {
    await renderWithApp(<CatalogScreen />, db);
    await screen.findByText("Çorbalar");
    expect(screen.queryByText("Son eklenenler")).toBeNull();
    expect(screen.getByTestId("catalog-add-custom")).toBeTruthy();
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

  it("shows the default serving and its kcal on each row", async () => {
    await renderWithApp(<CatalogScreen />, db);
    await fireEvent.press(await screen.findByText("Çorbalar"));
    expect(await screen.findByLabelText("Mercimek çorbası, Yemek · 1 kepçe, 92 kcal")).toBeTruthy();
    expect(screen.queryByText("Senin eklediğin")).toBeNull();
  });

  it.each([
    ["tr", "Yemeklerim", "Senin eklediğin", "senin eklediğin"],
    ["en", "My foods", "Added by you", "added by you"],
  ] as const)("marks custom rows in %s while keeping one accessible button", async (lang, segment, pill, label) => {
    await saveCustomFood(db, {
      nameTr: "Evde granola",
      per100g: { kcal: 400, protein: null, carbs: null, fat: null },
      portions: [],
    });
    await renderWithApp(<CatalogScreen />, db, lang);
    await fireEvent.press(await screen.findByLabelText(segment));
    // The visual pill is part of the row, with a single combined spoken label.
    expect(await screen.findByText(pill)).toBeTruthy();
    const rows = screen.getAllByRole("button").filter((b) => String(b.props.accessibilityLabel).startsWith("Evde granola,"));
    expect(rows).toHaveLength(1);
    expect(rows[0].props.accessible).toBe(true);
    expect(rows[0].props.accessibilityLabel).toMatch(new RegExp(`, ${label}$`));
  });

  it("clears the search with İptal", async () => {
    await renderWithApp(<CatalogScreen />, db);
    await screen.findByText("Çorbalar");
    await type("mercimek");
    await fireEvent.press(screen.getByRole("button", { name: "İptal" }));
    expect(screen.getByLabelText("Katalogda ara").props.value).toBe("");
    expect(await screen.findByText("Çorbalar")).toBeTruthy();
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
    await fireEvent.press(screen.getByLabelText("Kendi ürününü ekle"));
    expect(router.push).toHaveBeenCalledWith("/custom-food");
  });
});
