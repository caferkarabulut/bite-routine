import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { router, useLocalSearchParams } from "expo-router";

import { getWater } from "../src/db";
import { addDays, todayInIstanbul } from "../src/domain";
import { TodayScreen } from "../src/features/today/TodayScreen";
import { freezeDate } from "./helpers/history-harness";
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
    expect(await screen.findByLabelText("1.700 kcal kaldı")).toBeTruthy(); // ring
    expect(screen.getByText("1.700")).toBeTruthy();
    expect(screen.getByText("kcal kaldı")).toBeTruthy();
    expect(screen.getByText("300 kcal")).toBeTruthy(); // Yenen
    expect(screen.getByText("2.000 kcal")).toBeTruthy(); // Hedef
    expect(screen.getByText("30 / 100 g")).toBeTruthy(); // protein
    expect(screen.getByText(/Değerler yaklaşıktır/)).toBeTruthy();
  });

  it("shows the over text when the target is exceeded", async () => {
    const db = await makeDb();
    await seedProfile(db);
    await seedEntry(db, today, { grams: 2500 });
    await renderWithApp(<TodayScreen />, db);
    expect(await screen.findByLabelText("500 kcal fazla")).toBeTruthy();
    expect(screen.getByText("500")).toBeTruthy();
    expect(screen.getByText("kcal fazla")).toBeTruthy();
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
    expect(await screen.findByText("150 kcal")).toBeTruthy();
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

  it("shows an untouched day with every meal empty", async () => {
    const db = await makeDb();
    await seedProfile(db);
    await renderWithApp(<TodayScreen />, db);
    expect(await screen.findByLabelText("2.000 kcal kaldı")).toBeTruthy();
    expect(screen.getByText("0 kcal")).toBeTruthy(); // Yenen
    expect(screen.getAllByText("Henüz yemek yok")).toHaveLength(4);
    expect(screen.queryByText("Bugün henüz bir şey eklemedin.")).toBeNull();
  });

  it("asks for a profile when there are no targets", async () => {
    const db = await makeDb();
    await renderWithApp(<TodayScreen />, db);
    expect(await screen.findByText("Hedefini görmek için önce profilini tamamla.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Profili tamamla" }));
    expect(router.push).toHaveBeenCalledWith("/profile");
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
    const headers = screen.getAllByRole("header").map((h) => (Array.isArray(h.props.children) ? h.props.children[0] : h.props.children));
    expect(headers).toEqual(["Bugün", "Su", "Kahvaltı", "Öğle yemeği", "Akşam yemeği", "Atıştırmalık"]);
    expect(screen.getByRole("button", { name: /^Yumurta, 1,5 × Orta adet · 66 g, \d+ kcal$/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Elma, 100 g, \d+ kcal$/ })).toBeTruthy();
    expect(screen.getByText("1,5 × Orta adet · 66 g")).toBeTruthy();
    expect(screen.getByText("100 g")).toBeTruthy();
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

    const adds = screen.getAllByRole("button", { name: /öğününe yemek ekle$/ });
    expect(adds).toHaveLength(4);
    expect(adds[2].props.accessibilityLabel).toBe("Akşam yemeği öğününe yemek ekle");
    await fireEvent.press(adds[2]);
    expect(router.push).toHaveBeenLastCalledWith({ pathname: "/catalog", params: { date: today, meal: "dinner" } });
  });
});

describe("TodayScreen floating add", () => {
  afterEach(() => jest.useRealTimers());

  it.each([
    ["2026-11-27T01:59:00Z", "snack"],
    ["2026-11-27T02:00:00Z", "breakfast"],
    ["2026-11-27T08:00:00Z", "lunch"],
    ["2026-11-27T13:00:00Z", "dinner"],
    ["2026-11-27T18:59:00Z", "dinner"],
    ["2026-11-27T19:00:00Z", "snack"],
    ["2026-11-27T21:00:00Z", "snack"],
  ])("uses Istanbul time at %s and the displayed day", async (instant, meal) => {
    freezeDate(instant);
    const db = await makeDb();
    mockParams.mockReturnValue({ date: "2026-01-05" });
    await renderWithApp(<TodayScreen />, db);
    const add = await screen.findByTestId("today-add");
    expect(screen.getByRole("button", { name: "Yemek veya içecek ekle" })).toBe(add);
    expect(screen.getByText("Ekle")).toBeTruthy();
    await fireEvent.press(add);
    expect(router.push).toHaveBeenLastCalledWith({ pathname: "/catalog", params: { date: "2026-01-05", meal } });
  });

  it("chooses the meal when pressed, even if time changed after rendering", async () => {
    freezeDate("2026-11-27T07:59:00Z"); // 10:59 in Istanbul
    const db = await makeDb();
    await renderWithApp(<TodayScreen />, db, "en");
    await screen.findByRole("button", { name: "Add food or drink" });
    expect(screen.getByText("Add")).toBeTruthy();
    jest.setSystemTime(new Date("2026-11-27T08:00:00Z"));
    await fireEvent.press(screen.getByTestId("today-add"));
    expect(router.push).toHaveBeenLastCalledWith({ pathname: "/catalog", params: { date: "2026-11-27", meal: "lunch" } });
  });
});

describe("TodayScreen day selection", () => {
  it("navigates days and reloads", async () => {
    const db = await makeDb();
    await seedProfile(db);
    await seedEntry(db, addDays(today, -1), { foodName: "Dünkü yemek" });
    await renderWithApp(<TodayScreen />, db);
    await screen.findByLabelText("2.000 kcal kaldı");
    expect(screen.getByRole("header", { name: "Bugün" })).toBeTruthy();
    expect(screen.queryByText("Bugüne dön")).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Önceki gün" }));
    expect(await screen.findByText("Dünkü yemek")).toBeTruthy();
    expect(screen.getByRole("header", { name: "Dün" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sonraki gün" }).props.accessibilityState?.disabled).toBe(false);
    await fireEvent.press(screen.getByRole("button", { name: "Önceki gün" }));
    await screen.findAllByText("Henüz yemek yok");
    expect(screen.getByRole("header", { name: /^(Pazartesi|Salı|Çarşamba|Perşembe|Cuma|Cumartesi|Pazar)$/ })).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Bugüne dön" }));
    expect(await screen.findByLabelText("2.000 kcal kaldı")).toBeTruthy();
    expect(screen.getByRole("header", { name: "Bugün" })).toBeTruthy();
  });

  it("browses forward up to 7 days and names tomorrow", async () => {
    const db = await makeDb();
    await seedProfile(db);
    await renderWithApp(<TodayScreen />, db);
    await screen.findByLabelText("2.000 kcal kaldı");
    const next = () => screen.getByRole("button", { name: "Sonraki gün" });
    await fireEvent.press(next());
    expect(await screen.findByRole("header", { name: "Yarın" })).toBeTruthy();
    for (let i = 0; i < 6; i++) await fireEvent.press(next());
    await screen.findAllByText("Henüz yemek yok");
    expect(next().props.accessibilityState?.disabled).toBe(true);
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
    expect(await screen.findByLabelText("2.000 kcal kaldı")).toBeTruthy();
    expect(screen.getByRole("header", { name: "Bugün" })).toBeTruthy();
  });
});

describe("TodayScreen water", () => {
  it("adds water and undoes the last add", async () => {
    const db = await makeDb();
    await seedProfile(db);
    await renderWithApp(<TodayScreen />, db);
    await screen.findByText("0 / 2.000 ml");
    expect(screen.queryByRole("button", { name: "Son eklemeyi geri al" })).toBeNull(); // nothing to undo yet

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
    expect(screen.queryByRole("button", { name: "Son eklemeyi geri al" })).toBeNull();
  });
});
