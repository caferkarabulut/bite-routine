import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Alert } from "react-native";

import { getEntry, updateEntry } from "../src/db";
import { addDays, todayInIstanbul } from "../src/domain";
import { EntryEditScreen } from "../src/features/today/EntryEditScreen";
import { makeDb, renderWithApp, seedEntry } from "./helpers/today-harness";
import { guard, resetGuard } from "./helpers/prevent-remove";

jest.mock("expo-localization", () => ({ useLocales: () => [{ languageCode: "tr", languageTag: "tr-TR" }] }));
jest.mock("expo-router", () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: jest.fn(),
  usePreventRemove: require("./helpers/prevent-remove").usePreventRemove,
}));
jest.mock("../src/db", () => {
  const actual = jest.requireActual("../src/db");
  return { ...actual, updateEntry: jest.fn(actual.updateEntry) };
});

const mockParams = useLocalSearchParams as jest.Mock;
const mockUpdate = updateEntry as jest.Mock;
const today = todayInIstanbul();

// Egg (catalog) "Orta adet"; the snapshot deliberately says 40 g (catalog says 44 g). per100g kcal is 100.
const portionEntry = {
  grams: 60,
  portion: { id: "p88378", name: "Orta adet", gramsPerUnit: 40, quantity: 1.5 },
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("EntryEditScreen", () => {
  it("saves a changed amount as grams plus portion snapshot and goes back", async () => {
    const db = await makeDb();
    const entry = await seedEntry(db, today, portionEntry);
    mockParams.mockReturnValue({ id: entry.id });
    await renderWithApp(<EntryEditScreen />, db);

    const input = await screen.findByDisplayValue("1,5");
    await fireEvent.changeText(input, "2");
    expect(screen.getByText("80 kcal")).toBeTruthy(); // live preview: 2 x 40 g

    await fireEvent.press(screen.getByRole("button", { name: "Kaydet" }));
    await waitFor(() => expect(router.back).toHaveBeenCalled());

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate.mock.calls[0][2]).toEqual({
      grams: 80,
      portion: { id: "p88378", name: "Orta adet", gramsPerUnit: 40, quantity: 2 },
    });
    const saved = await getEntry(db, entry.id);
    expect(saved?.grams).toBe(80);
    expect(saved?.portion?.quantity).toBe(2);
    expect(saved?.portion?.gramsPerUnit).toBe(40);
  });

  it("sends only the meal slot for a meal-only change", async () => {
    const db = await makeDb();
    const entry = await seedEntry(db, today, portionEntry);
    mockParams.mockReturnValue({ id: entry.id });
    await renderWithApp(<EntryEditScreen />, db);
    await screen.findByDisplayValue("1,5");

    await fireEvent.press(screen.getByRole("radio", { name: "Akşam yemeği" }));
    await fireEvent.press(screen.getByRole("button", { name: "Kaydet" }));
    await waitFor(() => expect(router.back).toHaveBeenCalled());

    expect(mockUpdate.mock.calls[0][2]).toEqual({ mealSlot: "dinner" });
    const saved = await getEntry(db, entry.id);
    expect(saved?.mealSlot).toBe("dinner");
    expect(saved?.grams).toBe(60);
    expect(saved?.portion).toEqual(portionEntry.portion);
  });

  it("sends only the date for a day change", async () => {
    const db = await makeDb();
    const entry = await seedEntry(db, today);
    mockParams.mockReturnValue({ id: entry.id });
    await renderWithApp(<EntryEditScreen />, db);
    await screen.findByDisplayValue("100");

    await fireEvent.press(screen.getByRole("button", { name: "Önceki gün" }));
    await fireEvent.press(screen.getByRole("button", { name: "Kaydet" }));
    await waitFor(() => expect(router.back).toHaveBeenCalled());

    expect(mockUpdate.mock.calls[0][2]).toEqual({ date: addDays(today, -1) });
  });

  it("does not write when nothing changed", async () => {
    const db = await makeDb();
    const entry = await seedEntry(db, today, portionEntry);
    mockParams.mockReturnValue({ id: entry.id });
    await renderWithApp(<EntryEditScreen />, db);
    await screen.findByDisplayValue("1,5");
    await fireEvent.press(screen.getByRole("button", { name: "Kaydet" }));
    await waitFor(() => expect(router.back).toHaveBeenCalled());
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects an invalid amount without saving", async () => {
    const db = await makeDb();
    const entry = await seedEntry(db, today);
    mockParams.mockReturnValue({ id: entry.id });
    await renderWithApp(<EntryEditScreen />, db);
    await fireEvent.changeText(await screen.findByDisplayValue("100"), "abc");
    await fireEvent.press(screen.getByRole("button", { name: "Kaydet" }));
    expect(await screen.findByText(/en fazla 10.000/)).toBeTruthy();
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(router.back).not.toHaveBeenCalled();
  });

  it("keeps the stored portion when the food no longer exists", async () => {
    const db = await makeDb();
    const entry = await seedEntry(db, today, {
      ...portionEntry,
      food: { kind: "custom", id: "custom-gone" },
      foodName: "Silinmiş yemek",
    });
    mockParams.mockReturnValue({ id: entry.id });
    await renderWithApp(<EntryEditScreen />, db);
    expect(await screen.findByDisplayValue("1,5")).toBeTruthy();
    expect(screen.getByText(/artık bulunamıyor/)).toBeTruthy();
    expect(screen.getByRole("radio", { name: /^Orta adet \(40/ })).toBeTruthy(); // snapshot portion only
    expect(screen.queryByText(/Büyük adet/)).toBeNull();
  });

  it("deletes after the native confirmation", async () => {
    const db = await makeDb();
    const entry = await seedEntry(db, today);
    mockParams.mockReturnValue({ id: entry.id });
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    await renderWithApp(<EntryEditScreen />, db);
    await screen.findByDisplayValue("100");

    await fireEvent.press(screen.getByRole("button", { name: "Kaydı sil" }));
    expect(alert).toHaveBeenCalledTimes(1);
    expect(await getEntry(db, entry.id)).not.toBeNull(); // nothing deleted before confirming
    expect(router.back).not.toHaveBeenCalled();

    const buttons = alert.mock.calls[0][2] ?? [];
    const confirm = buttons.find((b) => b.style === "destructive");
    expect(buttons.some((b) => b.style === "cancel")).toBe(true);
    await confirm?.onPress?.();
    await waitFor(() => expect(router.back).toHaveBeenCalled());
    expect(await getEntry(db, entry.id)).toBeNull();
    alert.mockRestore();
  });

  it("shows a message for an unknown entry", async () => {
    const db = await makeDb();
    mockParams.mockReturnValue({ id: "entry-missing" });
    await renderWithApp(<EntryEditScreen />, db);
    expect(await screen.findByText("Kayıt bulunamadı.")).toBeTruthy();
  });

  describe("unsaved changes guard", () => {
    beforeEach(() => resetGuard());

    it("is dirty only while the amount, meal or day differ from the stored entry", async () => {
      const db = await makeDb();
      const entry = await seedEntry(db, today, portionEntry);
      mockParams.mockReturnValue({ id: entry.id });
      await renderWithApp(<EntryEditScreen />, db);
      const input = await screen.findByDisplayValue("1,5");
      expect(guard.active).toBe(false);

      await fireEvent.changeText(input, "2");
      expect(guard.active).toBe(true);
      await fireEvent.changeText(input, "1,5");
      expect(guard.active).toBe(false);

      await fireEvent.press(screen.getByRole("radio", { name: "Akşam yemeği" }));
      expect(guard.active).toBe(true);
    });

    it("lets the redirect after a save through", async () => {
      const db = await makeDb();
      const entry = await seedEntry(db, today, portionEntry);
      mockParams.mockReturnValue({ id: entry.id });
      await renderWithApp(<EntryEditScreen />, db);
      const input = await screen.findByDisplayValue("1,5");
      await fireEvent.changeText(input, "2");
      await fireEvent.press(screen.getByRole("button", { name: "Kaydet" }));
      await waitFor(() => expect(router.back).toHaveBeenCalled());
      expect(guard.disable).toHaveBeenCalledTimes(1);
    });
  });
});
