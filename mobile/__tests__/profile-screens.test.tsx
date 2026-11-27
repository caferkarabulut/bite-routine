import { act, fireEvent, render, screen } from "@testing-library/react-native";

import { OnboardingScreen } from "../src/features/profile/OnboardingScreen";
import { ProfileScreen } from "../src/features/profile/ProfileScreen";
import type { Profile } from "../src/types";
import { withI18n } from "./helpers/profile-harness";
import { attemptLeave, guard, resetGuard } from "./helpers/prevent-remove";

const mockReplace = jest.fn();
const mockBack = jest.fn();
jest.mock("expo-router", () => ({ usePreventRemove: require("./helpers/prevent-remove").usePreventRemove, router: { replace: (...a: unknown[]) => mockReplace(...a), back: () => mockBack() } }));
jest.mock("expo-localization", () => ({ useLocales: () => [{ languageCode: "tr", languageTag: "tr-TR" }] }));

const mockSaveProfile = jest.fn();
let mockProfile: Profile | null = null;
jest.mock("../src/state/AppState", () => ({
  useAppState: () => ({ profile: mockProfile, saveProfile: mockSaveProfile }),
}));

const stored: Profile = {
  birthYear: 1990,
  sex: "female",
  heightCm: 165,
  weightKg: 62.5,
  activity: "light",
  goal: "maintain",
  kcalOverride: 1900,
  proteinOverride: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

async function fillValid() {
  await fireEvent.changeText(screen.getByLabelText("Doğum yılı"), "1990");
  await fireEvent.press(screen.getByLabelText("Kadın"));
  await fireEvent.changeText(screen.getByLabelText("Boy (cm)"), "165");
  await fireEvent.changeText(screen.getByLabelText("Kilo (kg)"), "62,5");
  await fireEvent.press(screen.getByLabelText("Aktivite düzeyi"));
  await fireEvent.press(screen.getByLabelText("Hafif aktif, Haftada 1-3 gün egzersiz"));
  await fireEvent.press(screen.getByLabelText("Amaç"));
  await fireEvent.press(screen.getByLabelText("Kilomu koru, Harcadığın kadar ye"));
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSaveProfile.mockResolvedValue(undefined);
  mockProfile = null;
});

describe("OnboardingScreen", () => {
  it("shows the welcome text and no preview at first", async () => {
    await render(withI18n(<OnboardingScreen />));
    expect(screen.getByText("Bite Routine")).toBeTruthy();
    expect(screen.getByText(/Verilerin yalnız telefonunda/)).toBeTruthy();
    expect(screen.getByText(/Bilgileri doldurunca/)).toBeTruthy();
  });

  it("shows field errors on submit and does not save", async () => {
    await render(withI18n(<OnboardingScreen />));
    await fireEvent.press(screen.getByLabelText("Başla"));
    expect(screen.getAllByText("Bu alan gerekli.").length).toBeGreaterThanOrEqual(4);
    expect(mockSaveProfile).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("flags out-of-range values while typing", async () => {
    await render(withI18n(<OnboardingScreen />));
    await fireEvent.changeText(screen.getByLabelText("Boy (cm)"), "20");
    await fireEvent.changeText(screen.getByLabelText("Kilo (kg)"), "abc");
    expect(screen.getByText("Boy 100 ile 250 cm arasında olmalı.")).toBeTruthy();
    expect(screen.getByText("Kilo 30 ile 300 kg arasında olmalı.")).toBeTruthy();
  });

  it("shows a preview for valid input, then saves and navigates home", async () => {
    await render(withI18n(<OnboardingScreen />));
    await fillValid();
    expect(screen.queryByText(/Bilgileri doldurunca/)).toBeNull();
    expect(screen.getAllByText(/kcal/).length).toBeGreaterThan(0);
    expect(screen.getByText("Değerler yaklaşıktır, tıbbi tavsiye değildir.")).toBeTruthy();

    await fireEvent.press(screen.getByLabelText("Başla"));
    expect(mockSaveProfile).toHaveBeenCalledWith({
      birthYear: 1990,
      sex: "female",
      heightCm: 165,
      weightKg: 62.5,
      activity: "light",
      goal: "maintain",
      kcalOverride: null,
      proteinOverride: null,
    });
    expect(mockReplace).toHaveBeenCalledWith("/");
  });

  it("stays on the screen and shows an error when saving fails", async () => {
    mockSaveProfile.mockRejectedValue(new Error("disk"));
    await render(withI18n(<OnboardingScreen />));
    await fillValid();
    await fireEvent.press(screen.getByLabelText("Başla"));
    expect(await screen.findByText("Kaydedilemedi.")).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("keeps choices collapsed, marks the selected option and closes after selection", async () => {
    await render(withI18n(<OnboardingScreen />));
    expect(screen.queryByLabelText("Hafif aktif, Haftada 1-3 gün egzersiz")).toBeNull();
    await fireEvent.press(screen.getByLabelText("Aktivite düzeyi"));
    await fireEvent.press(screen.getByLabelText("Hafif aktif, Haftada 1-3 gün egzersiz"));
    expect(screen.getByLabelText("Aktivite düzeyi").props.accessibilityValue.text).toBe("Hafif aktif");
    await fireEvent.press(screen.getByLabelText("Aktivite düzeyi"));
    expect(screen.getByLabelText("Hafif aktif, Haftada 1-3 gün egzersiz").props.accessibilityState.checked).toBe(true);
  });

  it("supports manual target overrides during onboarding", async () => {
    await render(withI18n(<OnboardingScreen />));
    await fillValid();
    expect(screen.queryByLabelText("Kalori hedefi (kcal)")).toBeNull();
    await fireEvent.press(screen.getByLabelText("Hedefleri elle ayarla"));
    await fireEvent.changeText(screen.getByLabelText("Kalori hedefi (kcal)"), "2100");
    await fireEvent.changeText(screen.getByLabelText("Protein hedefi (g)"), "100");
    expect(screen.getByText("Günlük hedefin")).toBeTruthy();
    expect(screen.queryByText("Hesaplanan hedefin")).toBeNull();
    expect(screen.getByText("2.100 kcal")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Başla"));
    expect(mockSaveProfile).toHaveBeenCalledWith(expect.objectContaining({ kcalOverride: 2100, proteinOverride: 100 }));
  });

  it("renders in English", async () => {
    await render(withI18n(<OnboardingScreen />, "en"));
    expect(screen.getByText(/Your data stays on your phone/)).toBeTruthy();
    expect(screen.getByLabelText("Get started")).toBeTruthy();
  });
});

describe("ProfileScreen", () => {
  it("prefills the form and shows calculated hints next to overrides", async () => {
    mockProfile = stored;
    await render(withI18n(<ProfileScreen />));
    expect(screen.getByLabelText("Doğum yılı").props.value).toBe("1990");
    expect(screen.getByLabelText("Boy (cm)").props.value).toBe("165");
    expect(screen.getByLabelText("Kilo (kg)").props.value).toBe("62,5");
    await fireEvent.press(screen.getByLabelText("Hedefleri elle ayarla"));
    expect(screen.getByLabelText("Kalori hedefi (kcal)").props.value).toBe("1900");
    expect(screen.getByLabelText("Protein hedefi (g)").props.value).toBe("");
    expect(screen.getAllByText(/Hesaplanan:/).length).toBe(2);
    expect(screen.getByText("1.900 kcal")).toBeTruthy();
  });

  it("saves everything once and confirms the update in place", async () => {
    mockProfile = stored;
    await render(withI18n(<ProfileScreen />));
    await fireEvent.press(screen.getByLabelText("Hedefleri elle ayarla"));
    await fireEvent.changeText(screen.getByLabelText("Protein hedefi (g)"), "110");
    await fireEvent.changeText(screen.getByLabelText("Kilo (kg)"), "63");
    await fireEvent.press(screen.getByLabelText("Güncelle"));
    expect(mockSaveProfile).toHaveBeenCalledWith(expect.objectContaining({ weightKg: 63, kcalOverride: 1900, proteinOverride: 110 }));
    expect(mockBack).not.toHaveBeenCalled();
    expect(screen.getByText("Güncellendi.")).toBeTruthy();
  });

  it("resets overrides to calculated values", async () => {
    mockProfile = stored;
    await render(withI18n(<ProfileScreen />));
    await fireEvent.press(screen.getByLabelText("Hedefleri elle ayarla"));
    await fireEvent.press(screen.getByLabelText("Hesaplanana dön"));
    expect(screen.getByLabelText("Kalori hedefi (kcal)").props.value).toBe("");
    expect(screen.queryByLabelText("Hesaplanana dön")).toBeNull();
    await fireEvent.press(screen.getByLabelText("Güncelle"));
    expect(mockSaveProfile).toHaveBeenCalledWith(expect.objectContaining({ kcalOverride: null, proteinOverride: null }));
  });

  it("rejects an invalid override without saving", async () => {
    mockProfile = stored;
    await render(withI18n(<ProfileScreen />));
    await fireEvent.press(screen.getByLabelText("Hedefleri elle ayarla"));
    await fireEvent.changeText(screen.getByLabelText("Kalori hedefi (kcal)"), "abc");
    expect(screen.getByText("Geçerli bir sayı gir.")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Güncelle"));
    expect(mockSaveProfile).not.toHaveBeenCalled();
    expect(mockBack).not.toHaveBeenCalled();
  });

  it("saves personal fields, activity, goal and manual targets in a single call", async () => {
    mockProfile = stored;
    await render(withI18n(<ProfileScreen />));
    await fireEvent.changeText(screen.getByLabelText("Doğum yılı"), "1991");
    await fireEvent.press(screen.getByLabelText("Erkek"));
    await fireEvent.changeText(screen.getByLabelText("Boy (cm)"), "170");
    await fireEvent.changeText(screen.getByLabelText("Kilo (kg)"), "63");
    await fireEvent.press(screen.getByLabelText("Aktivite düzeyi"));
    await fireEvent.press(screen.getByLabelText("Orta aktif, Haftada 3-5 gün egzersiz"));
    await fireEvent.press(screen.getByLabelText("Amaç"));
    await fireEvent.press(screen.getByLabelText("Kilo al, Günlük yaklaşık 300 kcal fazla"));
    await fireEvent.press(screen.getByLabelText("Hedefleri elle ayarla"));
    await fireEvent.changeText(screen.getByLabelText("Kalori hedefi (kcal)"), "2200");
    await fireEvent.changeText(screen.getByLabelText("Protein hedefi (g)"), "120");
    await fireEvent.press(screen.getByLabelText("Güncelle"));
    expect(mockSaveProfile).toHaveBeenCalledTimes(1);
    expect(mockSaveProfile).toHaveBeenCalledWith({ birthYear: 1991, sex: "male", heightCm: 170, weightKg: 63, activity: "moderate", goal: "gain", kcalOverride: 2200, proteinOverride: 120 });
    expect(screen.getByText("Güncellendi.")).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();
  });

  it("keeps failed edits dirty and supports retrying the update", async () => {
    mockProfile = stored;
    mockSaveProfile.mockRejectedValueOnce(new Error("disk"));
    await render(withI18n(<ProfileScreen />));
    await fireEvent.changeText(screen.getByLabelText("Kilo (kg)"), "63");
    await fireEvent.press(screen.getByLabelText("Güncelle"));
    expect(screen.getByText("Kaydedilemedi.")).toBeTruthy();
    expect(guard.active).toBe(true);
    expect(screen.queryByText("Güncellendi.")).toBeNull();
    await fireEvent.press(screen.getByLabelText("Güncelle"));
    expect(screen.getByText("Güncellendi.")).toBeTruthy();
    expect(guard.active).toBe(false);
  });

  it("does not mark edits made during an in-flight save as saved", async () => {
    mockProfile = stored;
    let finish!: () => void;
    mockSaveProfile.mockImplementationOnce(() => new Promise<void>((resolve) => { finish = resolve; }));
    await render(withI18n(<ProfileScreen />));
    await fireEvent.changeText(screen.getByLabelText("Kilo (kg)"), "63");
    await fireEvent.press(screen.getByLabelText("Güncelle"));
    expect(screen.getByLabelText("Güncelle").props.accessibilityState.busy).toBe(true);
    await fireEvent.changeText(screen.getByLabelText("Kilo (kg)"), "64");
    await act(async () => finish());
    expect(guard.active).toBe(true);
    expect(screen.queryByText("Güncellendi.")).toBeNull();
  });

  describe("unsaved changes guard", () => {
    beforeEach(() => resetGuard());

    it("is clean on open, dirty after an edit, clean after reverting", async () => {
      mockProfile = stored;
      await render(withI18n(<ProfileScreen />));
      expect(guard.active).toBe(false);
      await fireEvent.changeText(screen.getByLabelText("Boy (cm)"), "170");
      expect(guard.active).toBe(true);
      expect(attemptLeave()).toBe(false);
      await fireEvent.changeText(screen.getByLabelText("Boy (cm)"), "165");
      expect(guard.active).toBe(false);
    });

    it("treats a changed choice as a change", async () => {
      mockProfile = stored;
      await render(withI18n(<ProfileScreen />));
      await fireEvent.press(screen.getByLabelText("Erkek"));
      expect(guard.active).toBe(true);
    });

    it("marks saved values clean and guards subsequent edits again", async () => {
      mockProfile = stored;
      await render(withI18n(<ProfileScreen />));
      await fireEvent.changeText(screen.getByLabelText("Kilo (kg)"), "63");
      await fireEvent.press(screen.getByLabelText("Güncelle"));
      expect(mockBack).not.toHaveBeenCalled();
      expect(guard.active).toBe(false);
      await fireEvent.changeText(screen.getByLabelText("Kilo (kg)"), "64");
      expect(guard.active).toBe(true);
      expect(screen.queryByText("Güncellendi.")).toBeNull();
    });

    it("does not guard onboarding", async () => {
      await render(withI18n(<OnboardingScreen />));
      await fireEvent.changeText(screen.getByLabelText("Boy (cm)"), "170");
      expect(guard.callback).toBeUndefined();
    });
  });
});
