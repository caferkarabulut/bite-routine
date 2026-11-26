import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { router, useLocalSearchParams } from "expo-router";

import { getWater } from "../src/db";
import { addDays, todayInIstanbul } from "../src/domain";
import { TodayScreen } from "../src/features/today/TodayScreen";
import { makeDb, renderWithApp, seedEntry, seedProfile } from "./helpers/today-harness";

jest.mock("expo-localization", () => ({ useLocales: () => [{ languageCode: "tr", languageTag: "tr-TR" }] }));
jest.mock("expo-router", () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: jest.fn(),
}));

const mockParams = useLocalSearchParams as jest.Mock;
const today = todayInIstanbul();

beforeEach(() => {
  jest.clearAllMocks();
  mockParams.mockReturnValue({});
});

describe("TodayScreen summary", () => {
  it("sums entries and shows remaining kcal", async () => {
    const db = await makeDb();
    await seedProfile(db);
    await seedEntry(db, today, { grams: 100 }); // 100 kcal
    await seedEntry(db, today, { grams: 200, mealSlot: "lunch" }); // 200 kcal
    await renderWithApp(<TodayScreen />, db);
    expect(await screen.findByText("300 / 2.000 kcal")).toBeTruthy();
    expect(screen.getByText("1.700 kcal kaldı")).toBeTruthy();
    expect(screen.getByText("30 / 100 g")).toBeTruthy(); // protein
    expect(screen.getByText(/Değerler yaklaşıktır/)).toBeTruthy();
  });

  it("shows the over text when the target is exceeded", async () => {
    const db = await makeDb();
    await seedProfile(db);
    await seedEntry(db, today, { grams: 2500 });
    await renderWithApp(<TodayScreen />, db);
    expect(await screen.findByText("500 kcal fazla")).toBeTruthy();
    expect(screen.queryByText(/kaldı/)).toBeNull();
  });

  it("propagates missing nutrient data instead of showing a wrong number", async () => {
    const db = await makeDb();
    await seedProfile(db);
    await seedEntry(db, today, { grams: 100 });
    await seedEntry(db, today, {
      grams: 100,
      mealSlot: "snack",
      per100g: { kcal: 50, protein: null, carbs: 1, fat: 1 },
    });
    await renderWithApp(<TodayScreen />, db);
    expect(await screen.findByText("150 / 2.000 kcal")).toBeTruthy();
    expect(screen.getAllByText("Veri yok")).toHaveLength(1); // protein only
    expect(screen.getByText(/toplamlar eksik olabilir/)).toBeTruthy();
  });

  it("shows no-data kcal when an entry has no kcal", async () => {
    const db = await makeDb();
    await seedProfile(db);
    await seedEntry(db, today, { per100g: { kcal: null, protein: 1, carbs: 1, fat: 1 } });
    await renderWithApp(<TodayScreen />, db);
    expect((await screen.findAllByText("Veri yok")).length).toBeGreaterThan(0);
    expect(screen.queryByText(/kcal kaldı/)).toBeNull();
  });

  it("shows the empty day state", async () => {
    const db = await makeDb();
    await seedProfile(db);
    await renderWithApp(<TodayScreen />, db);
    expect(await screen.findByText("Bugün henüz bir şey eklemedin.")).toBeTruthy();
    expect(screen.getByText("0 / 2.000 kcal")).toBeTruthy();
  });
});

describe("TodayScreen meals", () => {
  it("groups entries by meal in fixed order with amounts", async () => {
    const db = await makeDb();
    await seedProfile(db);
    await seedEntry(db, today, { mealSlot: "snack", foodName: "Elma", grams: 100 });
    await seedEntry(db, today, {
      mealSlot: "breakfast",
      foodName: "Yumurta",
      grams: 66,
      portion: { id: "p1", name: "Orta adet", gramsPerUnit: 44, quantity: 1.5 },
    });
    await renderWithApp(<TodayScreen />, db);
    await screen.findByText("Yumurta");
    const headers = screen.getAllByRole("header").map((h) => h.props.children);
    expect(headers).toEqual(["Kahvaltı", "Öğle yemeği", "Akşam yemeği", "Atıştırmalık", "Su"]);
    expect(screen.getByRole("button", { name: /^Yumurta, 1,5 × Orta adet, \d+ kcal$/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Elma, 100 g, \d+ kcal$/ })).toBeTruthy();
    expect(screen.getAllByText("66 kcal").length).toBeGreaterThanOrEqual(2); // meal total + row
    expect(screen.getAllByText("Henüz yemek yok")).toHaveLength(2);
  });

  it("opens an entry and the catalog for a meal", async () => {
    const db = await makeDb();
    await seedProfile(db);
    const entry = await seedEntry(db, today, { foodName: "Yumurta" });
    await renderWithApp(<TodayScreen />, db);
    await fireEvent.press(await screen.findByRole("button", { name: /Yumurta/ }));
    expect(router.push).toHaveBeenCalledWith({ pathname: "/entry/[id]", params: { id: entry.id } });

    const adds = screen.getAllByRole("button", { name: "+ Ekle" });
    expect(adds).toHaveLength(4);
    await fireEvent.press(adds[2]);
    expect(router.push).toHaveBeenLastCalledWith({ pathname: "/catalog", params: { date: today, meal: "dinner" } });
  });
});

describe("TodayScreen day selection", () => {
  it("navigates days and reloads", async () => {
    const db = await makeDb();
    await seedProfile(db);
    await seedEntry(db, addDays(today, -1), { foodName: "Dünkü yemek" });
    await renderWithApp(<TodayScreen />, db);
    await screen.findByText("Bugün henüz bir şey eklemedin.");
    await fireEvent.press(screen.getByRole("button", { name: "Önceki gün" }));
    expect(await screen.findByText("Dünkü yemek")).toBeTruthy();
  });

  it("opens the day from a valid date param", async () => {
    const db = await makeDb();
    await seedProfile(db);
    await seedEntry(db, "2026-01-05", { foodName: "Ocak yemeği" });
    mockParams.mockReturnValue({ date: "2026-01-05" });
    await renderWithApp(<TodayScreen />, db);
    expect(await screen.findByText("Ocak yemeği")).toBeTruthy();
  });

  it("ignores an invalid date param", async () => {
    const db = await makeDb();
    await seedProfile(db);
    mockParams.mockReturnValue({ date: "2026-02-31" });
    await renderWithApp(<TodayScreen />, db);
    expect(await screen.findByText("Bugün henüz bir şey eklemedin.")).toBeTruthy();
  });
});

describe("TodayScreen water", () => {
  it("adds water and undoes the last add", async () => {
    const db = await makeDb();
    await seedProfile(db);
    await renderWithApp(<TodayScreen />, db);
    await screen.findByText("0 / 2.000 ml");
    const undo = screen.getByRole("button", { name: "Son eklemeyi geri al" });
    expect(undo.props.accessibilityState?.disabled).toBe(true);

    await fireEvent.press(screen.getByRole("button", { name: "200 ml ekle" }));
    expect(await screen.findByText("200 / 2.000 ml")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "500 ml ekle" }));
    expect(await screen.findByText("700 / 2.000 ml")).toBeTruthy();
    expect(await getWater(db, today)).toBe(700);

    await fireEvent.press(screen.getByRole("button", { name: "Son eklemeyi geri al" }));
    expect(await screen.findByText("200 / 2.000 ml")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Son eklemeyi geri al" }));
    await waitFor(() => expect(screen.getByText("0 / 2.000 ml")).toBeTruthy());
    expect(await getWater(db, today)).toBe(0);
  });
});
