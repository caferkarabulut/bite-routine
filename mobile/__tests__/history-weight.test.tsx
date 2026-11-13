import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

import { addWeight, getProfile, listWeights, saveProfile } from "../src/db";
import { WeightScreen } from "../src/features/history/WeightScreen";
import { freezeDate, freshDb, renderWithApp, TODAY } from "./helpers/history-harness";

jest.mock("expo-localization", () => ({ useLocales: () => [{ languageCode: "tr" }] }));

const profile = {
  birthYear: 1990,
  sex: "male" as const,
  heightCm: 180,
  weightKg: 80,
  activity: "moderate" as const,
  goal: "lose" as const,
  kcalOverride: 2100,
  proteinOverride: 120,
};

beforeEach(() => freezeDate());
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

async function enter(text: string) {
  await fireEvent.changeText(screen.getByLabelText("Kilo (kg)"), text);
  await fireEvent.press(screen.getByRole("button", { name: "Kaydet" }));
}

describe("WeightScreen", () => {
  it("adds today's weight with a Turkish comma and lists it", async () => {
    const db = await freshDb();
    await renderWithApp(<WeightScreen />, db);
    await screen.findByText("Henüz kilo kaydı yok.");
    await enter("72,4");
    expect(await screen.findByText("Kilo kaydedildi.")).toBeTruthy();
    expect((await listWeights(db)).map((w) => [w.date, w.kg])).toEqual([[TODAY, 72.4]]);
    expect(await screen.findByText("72,4 kg")).toBeTruthy();
    expect(screen.getByText("Tek kayıt: 72,4 kg")).toBeTruthy();
  });

  it("updates the same day instead of adding a second entry", async () => {
    const db = await freshDb();
    await addWeight(db, TODAY, 72);
    await renderWithApp(<WeightScreen />, db);
    expect(await screen.findByText("Bugünkü kayıt güncellenir.")).toBeTruthy();
    await enter("71.5");
    await waitFor(() => expect(screen.getByText("71,5 kg")).toBeTruthy());
    const rows = await listWeights(db);
    expect(rows).toHaveLength(1);
    expect(rows[0].kg).toBe(71.5);
  });

  it.each(["", "abc", "19,9", "400,1", "0", "-70"])("rejects invalid input %p", async (value) => {
    const db = await freshDb();
    await renderWithApp(<WeightScreen />, db);
    await screen.findByText("Henüz kilo kaydı yok.");
    await enter(value);
    expect(await screen.findByText("Kilo 20 ile 400 kg arasında olmalı.")).toBeTruthy();
    expect(await listWeights(db)).toHaveLength(0);
  });

  it("accepts the 20 and 400 kg bounds", async () => {
    const db = await freshDb();
    await renderWithApp(<WeightScreen />, db);
    await screen.findByText("Henüz kilo kaydı yok.");
    await enter("20");
    await screen.findByText("Kilo kaydedildi.");
    await enter("400");
    await waitFor(() => expect(screen.getByText("400,0 kg")).toBeTruthy());
  });

  it("lists newest first and shows the chart summary with min/max", async () => {
    const db = await freshDb();
    await addWeight(db, "2026-11-01", 72.4);
    await addWeight(db, "2026-11-05", 71);
    await addWeight(db, "2026-11-10", 70.1);
    await renderWithApp(<WeightScreen />, db);
    await screen.findByText("Son 3 kayıtta 72,4 → 70,1 kg");
    expect(screen.getByLabelText("Son 3 kayıtta 72,4 → 70,1 kg")).toBeTruthy();
    expect(screen.getByText("En düşük 70,1 kg")).toBeTruthy();
    expect(screen.getByText("En yüksek 72,4 kg")).toBeTruthy();
    const values = screen.getAllByText(/^\d\d,\d kg$/).map((n) => n.props.children);
    expect(values).toEqual(["70,1 kg", "71,0 kg", "72,4 kg"]);
  });

  it("asks before deleting and deletes on confirm", async () => {
    const db = await freshDb();
    await addWeight(db, "2026-11-10", 70.1);
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    await renderWithApp(<WeightScreen />, db);
    await await fireEvent.press(await screen.findByRole("button", { name: "10 Kasım Salı kaydını sil" }));
    expect(alert).toHaveBeenCalledTimes(1);
    expect(await listWeights(db)).toHaveLength(1);

    const buttons = alert.mock.calls[0][2]!;
    await act(async () => {
      buttons.find((b) => b.style === "destructive")!.onPress!();
    });
    await waitFor(async () => expect(await listWeights(db)).toHaveLength(0));
    expect(await screen.findByText("Henüz kilo kaydı yok.")).toBeTruthy();
  });

  it("keeps the entry when delete is cancelled", async () => {
    const db = await freshDb();
    await addWeight(db, "2026-11-10", 70.1);
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    await renderWithApp(<WeightScreen />, db);
    await await fireEvent.press(await screen.findByRole("button", { name: /kaydını sil/ }));
    const cancel = alert.mock.calls[0][2]!.find((b) => b.style === "cancel")!;
    await act(async () => { cancel.onPress?.(); });
    expect(await listWeights(db)).toHaveLength(1);
  });

  it("offers to update the profile weight, and does so only on request", async () => {
    const db = await freshDb();
    await saveProfile(db, profile);
    await renderWithApp(<WeightScreen />, db);
    await screen.findByText("Henüz kilo kaydı yok.");
    await enter("78,5");
    expect(await screen.findByText("Profildeki kilo 80,0 kg; yeni kilon 78,5 kg.")).toBeTruthy();
    expect((await getProfile(db))!.weightKg).toBe(80);

    await fireEvent.press(screen.getByRole("button", { name: "Profildeki kiloyu da güncelle" }));
    await screen.findByText("Profildeki kilo güncellendi.");
    const saved = (await getProfile(db))!;
    expect(saved.weightKg).toBe(78.5);
    expect(saved.kcalOverride).toBe(2100);
    expect(saved.proteinOverride).toBe(120);
    expect(saved.heightCm).toBe(180);
    expect(screen.queryByRole("button", { name: "Profildeki kiloyu da güncelle" })).toBeNull();
  });

  it("can dismiss the offer, and does not offer when the weight matches the profile", async () => {
    const db = await freshDb();
    await saveProfile(db, profile);
    await renderWithApp(<WeightScreen />, db);
    await screen.findByText("Henüz kilo kaydı yok.");
    await enter("79");
    await await fireEvent.press(await screen.findByRole("button", { name: "Şimdi değil" }));
    expect(screen.queryByRole("button", { name: "Profildeki kiloyu da güncelle" })).toBeNull();
    expect((await getProfile(db))!.weightKg).toBe(80);

    await enter("80");
    await screen.findByText("80,0 kg");
    expect(screen.queryByRole("button", { name: "Profildeki kiloyu da güncelle" })).toBeNull();
  });

  it("does not offer without a profile", async () => {
    const db = await freshDb();
    await renderWithApp(<WeightScreen />, db);
    await screen.findByText("Henüz kilo kaydı yok.");
    await enter("70");
    await screen.findByText("Kilo kaydedildi.");
    expect(screen.queryByRole("button", { name: "Profildeki kiloyu da güncelle" })).toBeNull();
  });
});
