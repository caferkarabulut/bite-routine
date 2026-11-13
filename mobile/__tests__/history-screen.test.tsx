import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import { addEntry, addWeight, saveProfile } from "../src/db";
import { HistoryScreen } from "../src/features/history/HistoryScreen";
import { entryInput, freezeDate, freshDb, renderWithApp, TODAY } from "./helpers/history-harness";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({ router: { push: (...a: unknown[]) => mockPush(...a) } }));
jest.mock("expo-localization", () => ({ useLocales: () => [{ languageCode: "tr" }] }));

const profile = {
  birthYear: 1990,
  sex: "female" as const,
  heightCm: 165,
  weightKg: 65,
  activity: "light" as const,
  goal: "maintain" as const,
  kcalOverride: 2000,
  proteinOverride: null,
};
const full = { kcal: 200, protein: 10, carbs: 20, fat: 5 };

beforeEach(() => {
  freezeDate();
  mockPush.mockClear();
});
afterEach(() => jest.useRealTimers());

describe("HistoryScreen", () => {
  it("shows empty week state and 'Kayıt yok' for each day", async () => {
    const db = await freshDb();
    await renderWithApp(<HistoryScreen />, db);
    expect(await screen.findByText("Bu hafta henüz kayıt yok.")).toBeTruthy();
    expect(screen.getAllByText("Kayıt yok")).toHaveLength(7);
    expect(screen.getByText("Günlük ortalama: veri yok")).toBeTruthy();
    expect(screen.getByText("0 / 7 gün kayıtlı")).toBeTruthy();
  });

  it("shows totals vs target, macros, incomplete days and the average over logged days", async () => {
    const db = await freshDb();
    await saveProfile(db, profile);
    await addEntry(db, entryInput(TODAY, full, 500)); // 1000 kcal, 50/100/25
    await addEntry(db, entryInput("2026-11-11", full, 1000)); // 2000 kcal
    await addEntry(db, entryInput("2026-11-12", { ...full, kcal: null }));
    await renderWithApp(<HistoryScreen />, db);

    expect(await screen.findByText("1.000 / 2.000 kcal")).toBeTruthy();
    expect(screen.getByText("2.000 / 2.000 kcal")).toBeTruthy();
    expect(screen.getByText("P 50 g · K 100 g · Y 25 g")).toBeTruthy();
    expect(screen.getAllByText("Eksik veri")).toHaveLength(1);
    expect(screen.getByText("Bazı kayıtların besin değeri bilinmiyor.")).toBeTruthy();
    expect(screen.getAllByText("Kayıt yok")).toHaveLength(4);
    expect(screen.getByText("Günlük ortalama: 1.500 kcal")).toBeTruthy();
    expect(screen.getByText("3 / 7 gün kayıtlı")).toBeTruthy();
    expect(screen.getByTestId(`bar-${TODAY}`).props.style).toEqual(expect.arrayContaining([expect.objectContaining({ width: "50%" })]));
  });

  it("navigates between weeks and blocks the future", async () => {
    const db = await freshDb();
    await addEntry(db, entryInput("2026-11-03", full));
    await renderWithApp(<HistoryScreen />, db);
    await screen.findByText("Bu hafta");
    expect(screen.getByRole("button", { name: "Sonraki hafta" })).toBeDisabled();

    await fireEvent.press(screen.getByRole("button", { name: "Önceki hafta" }));
    await waitFor(() => expect(screen.getByText("1 / 7 gün kayıtlı")).toBeTruthy());
    expect(screen.queryByText("Bu hafta")).toBeNull();
    expect(screen.getByRole("button", { name: "Sonraki hafta" })).toBeEnabled();

    await fireEvent.press(screen.getByRole("button", { name: "Sonraki hafta" }));
    await screen.findByText("Bu hafta");
    expect(screen.getByRole("button", { name: "Sonraki hafta" })).toBeDisabled();
  });

  it("opens the Today tab with the date when a day is tapped", async () => {
    const db = await freshDb();
    await renderWithApp(<HistoryScreen />, db);
    await screen.findByText("Bu hafta henüz kayıt yok.");
    await fireEvent.press(screen.getByRole("button", { name: /12 Kasım Perşembe: Kayıt yok/ }));
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/", params: { date: "2026-11-12" } });
  });

  it("links to the weight screen with the latest weight", async () => {
    const db = await freshDb();
    await addWeight(db, "2026-11-01", 72.4);
    await addWeight(db, "2026-11-10", 70.1);
    await renderWithApp(<HistoryScreen />, db);
    expect(await screen.findByText(/Son kayıt: 70,1 kg/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Kilo" }));
    expect(mockPush).toHaveBeenCalledWith("/weight");
  });

  it("shows an error with retry when loading fails", async () => {
    const db = await freshDb();
    const original = db.getAllAsync;
    let fail = true;
    db.getAllAsync = (async (...args: Parameters<typeof original>) => {
      if (fail) throw new Error("boom");
      return original(...args);
    }) as typeof original;
    await renderWithApp(<HistoryScreen />, db);
    expect(await screen.findByText("Geçmiş yüklenemedi.")).toBeTruthy();
    fail = false;
    await fireEvent.press(screen.getByRole("button", { name: "Tekrar dene" }));
    expect(await screen.findByText("Bu hafta henüz kayıt yok.")).toBeTruthy();
  });

  it("renders in English", async () => {
    const db = await freshDb();
    await renderWithApp(<HistoryScreen />, db, "en");
    expect(await screen.findByText("No records this week yet.")).toBeTruthy();
  });
});
