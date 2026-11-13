import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import * as DocumentPicker from "expo-document-picker";
import * as Notifications from "expo-notifications";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";

import { addEntry, exportBackup, getProfile, getSettings, listEntriesInRange, saveSettings, validateBackup } from "../src/db";
import { SettingsScreen } from "../src/features/settings/SettingsScreen";
import { freshDb, renderWithApp, seedProfile } from "./helpers/settings-harness";

const mockFiles = new Map<string, string>();
const mockPush = jest.fn();

jest.mock("expo-localization", () => ({ useLocales: () => [{ languageCode: "tr", languageTag: "tr-TR" }] }));
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock("expo-constants", () => ({ __esModule: true, default: { expoConfig: { version: "1.2.3" } } }));
jest.mock("expo-sharing", () => ({ isAvailableAsync: jest.fn(), shareAsync: jest.fn() }));
jest.mock("expo-document-picker", () => ({ getDocumentAsync: jest.fn() }));
jest.mock("expo-file-system", () => ({
  Paths: { cache: "file:///cache/" },
  File: class {
    uri: string;
    constructor(...parts: (string | { uri: string })[]) {
      this.uri = parts.map((p) => (typeof p === "string" ? p : p.uri)).join("");
    }
    create() {}
    async write(content: string) {
      mockFiles.set(this.uri, content);
    }
    async text() {
      const text = mockFiles.get(this.uri);
      if (text === undefined) throw new Error("not found");
      return text;
    }
  },
}));
jest.mock("expo-notifications", () => ({
  AndroidImportance: { DEFAULT: 5 },
  SchedulableTriggerInputTypes: { DAILY: "daily" },
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(async () => "id"),
  cancelScheduledNotificationAsync: jest.fn(async () => {}),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => {}),
  setNotificationChannelAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
}));

const notifications = jest.mocked(Notifications);
const picker = jest.mocked(DocumentPicker);
const sharing = jest.mocked(Sharing);

const granted = { granted: true, canAskAgain: true, status: "granted", expires: "never" } as never;
const denied = { granted: false, canAskAgain: true, status: "denied", expires: "never" } as never;

let alertSpy: jest.SpiedFunction<typeof Alert.alert>;

beforeEach(() => {
  mockFiles.clear();
  jest.clearAllMocks();
  notifications.getPermissionsAsync.mockResolvedValue(denied);
  notifications.requestPermissionsAsync.mockResolvedValue(granted);
  sharing.isAvailableAsync.mockResolvedValue(true);
  alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
});

afterEach(() => alertSpy.mockRestore());

async function mountSettings(setup?: (db: Awaited<ReturnType<typeof freshDb>>) => Promise<void>) {
  const db = await freshDb();
  await seedProfile(db);
  await setup?.(db);
  await renderWithApp(db, <SettingsScreen />);
  await screen.findByLabelText("Cihaz dili");
  return db;
}

describe("SettingsScreen", () => {
  it("shows the profile target, version and navigates", async () => {
    await mountSettings();
    expect(screen.getByText("Sürüm 1.2.3")).toBeTruthy();
    expect(screen.getByLabelText(/^Profil ve hedef, Günlük hedef: .* kcal$/)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText(/^Profil ve hedef/));
    expect(mockPush).toHaveBeenCalledWith("/profile");
    await fireEvent.press(screen.getByLabelText("Kaynaklar ve lisanslar"));
    expect(mockPush).toHaveBeenCalledWith("/sources");
    await fireEvent.press(screen.getByLabelText("Gizlilik"));
    expect(mockPush).toHaveBeenCalledWith("/privacy");
  });

  it("changes the language and persists it", async () => {
    const db = await mountSettings();
    await fireEvent.press(screen.getByLabelText("English"));
    expect(await screen.findByText("Data")).toBeTruthy();
    await waitFor(async () => expect((await getSettings(db)).language).toBe("en"));
    await fireEvent.press(screen.getByLabelText("Device language"));
    await waitFor(async () => expect((await getSettings(db)).language).toBeNull());
  });

  it("validates the water goal range before saving", async () => {
    const db = await mountSettings();
    const input = screen.getByLabelText("Günlük su hedefi (ml)");
    for (const bad of ["499", "6001", "abc", "1500.5"]) {
      await fireEvent.changeText(input, bad);
      await fireEvent.press(screen.getByLabelText("Kaydet"));
      expect(screen.getByText("500 ile 6000 ml arasında bir tam sayı gir.")).toBeTruthy();
    }
    expect((await getSettings(db)).waterGoalMl).toBe(2000);
    await fireEvent.changeText(input, "2500");
    await fireEvent.press(screen.getByLabelText("Kaydet"));
    expect(await screen.findByText("Su hedefi kaydedildi.")).toBeTruthy();
    expect((await getSettings(db)).waterGoalMl).toBe(2500);
  });

  describe("reminders", () => {
    const toggle = (name: string) => screen.getByLabelText(`${name}: aç veya kapat`);

    it("enables a reminder with permission: asks, schedules a daily trigger, saves", async () => {
      const db = await mountSettings();
      await fireEvent.press(toggle("Kahvaltı hatırlatıcısı"));
      await waitFor(() => expect(notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1));
      expect(notifications.requestPermissionsAsync).toHaveBeenCalled();
      expect(notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        identifier: "meal-breakfast",
        content: { title: "Bite Routine", body: expect.stringContaining("Kahvaltı") },
        trigger: { type: "daily", hour: 8, minute: 30, channelId: "reminders" },
      });
      await waitFor(async () => {
        const saved = (await getSettings(db)).reminders.find((r) => r.id === "meal-breakfast");
        expect(saved).toMatchObject({ enabled: true, hour: 8, minute: 30 });
      });
    });

    it("keeps the reminder off and explains when permission is denied", async () => {
      notifications.requestPermissionsAsync.mockResolvedValue(denied);
      const db = await mountSettings();
      await fireEvent.press(toggle("Su hatırlatıcısı (her gün)"));
      expect(await screen.findByText(/Bildirim izni verilmedi/)).toBeTruthy();
      expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
      expect((await getSettings(db)).reminders.some((r) => r.enabled)).toBe(false);
    });

    it("reschedules on time change and cancels when disabled", async () => {
      const db = await mountSettings();
      await fireEvent.press(toggle("Akşam yemeği hatırlatıcısı"));
      await waitFor(() => expect(notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1));
      await fireEvent.press(screen.getAllByLabelText("Dakikayı artır")[2]);
      await waitFor(() => expect(notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(2));
      expect(notifications.scheduleNotificationAsync).toHaveBeenLastCalledWith(
        expect.objectContaining({
          identifier: "meal-dinner",
          trigger: expect.objectContaining({ type: "daily", hour: 19, minute: 5 }),
        }),
      );
      await fireEvent.press(screen.getAllByLabelText("Saati azalt")[2]);
      await waitFor(() => expect(notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(3));
      await fireEvent.press(toggle("Akşam yemeği hatırlatıcısı"));
      await waitFor(async () => {
        const saved = (await getSettings(db)).reminders.find((r) => r.id === "meal-dinner");
        expect(saved).toMatchObject({ enabled: false, hour: 18, minute: 5 });
      });
      expect(notifications.cancelScheduledNotificationAsync).toHaveBeenLastCalledWith("meal-dinner");
      expect(notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(3);
    });

    it("writes notification text in the chosen language", async () => {
      await mountSettings();
      await fireEvent.press(screen.getByLabelText("English"));
      await screen.findByText("Data");
      await fireEvent.press(screen.getByLabelText("Water reminder (every day): turn on or off"));
      await waitFor(() => expect(notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1));
      expect(notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({ content: { title: "Bite Routine", body: "Time for a glass of water." } }),
      );
    });
  });

  describe("backup", () => {
    it("writes valid JSON to the cache and opens the share sheet", async () => {
      const db = await mountSettings(async (d) => {
        await addEntry(d, {
          date: "2026-10-01",
          mealSlot: "lunch",
          food: { kind: "dish", id: "x" },
          foodName: "Mercimek çorbası",
          grams: 250,
          portion: null,
          per100g: { kcal: 60, protein: 3, carbs: 8, fat: 2 },
        });
      });
      await fireEvent.press(screen.getByLabelText("Yedekle"));
      await waitFor(() => expect(sharing.shareAsync).toHaveBeenCalledTimes(1));
      const [uri, options] = sharing.shareAsync.mock.calls[0];
      expect(uri).toMatch(/^file:\/\/\/cache\/bite-routine-yedek-\d{4}-\d{2}-\d{2}\.json$/);
      expect(options).toMatchObject({ mimeType: "application/json" });
      const parsed: unknown = JSON.parse(mockFiles.get(uri) ?? "");
      const checked = validateBackup(parsed);
      expect(checked.ok).toBe(true);
      if (checked.ok) expect(checked.data.diaryEntries).toHaveLength(1);
      expect(await screen.findByText("Yedek hazır.")).toBeTruthy();
      expect(db).toBeTruthy();
    });

    it("reports when sharing is unavailable", async () => {
      sharing.isAvailableAsync.mockResolvedValue(false);
      await mountSettings();
      await fireEvent.press(screen.getByLabelText("Yedekle"));
      expect(await screen.findByText("Bu cihazda paylaşma kullanılamıyor.")).toBeTruthy();
      expect(sharing.shareAsync).not.toHaveBeenCalled();
    });
  });

  describe("restore", () => {
    async function sourceBackup() {
      const src = await freshDb();
      await seedProfile(src);
      await addEntry(src, {
        date: "2026-10-02",
        mealSlot: "dinner",
        food: { kind: "dish", id: "y" },
        foodName: "Karnıyarık",
        grams: 300,
        portion: null,
        per100g: { kcal: 150, protein: 6, carbs: 10, fat: 9 },
      });
      await saveSettings(src, { language: "en", waterGoalMl: 3000, reminders: [] });
      return await exportBackup(src);
    }
    const pickFile = (text: string) => {
      mockFiles.set("file:///picked/backup.json", text);
      picker.getDocumentAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri: "file:///picked/backup.json", name: "backup.json" }],
      } as never);
    };
    const confirmButton = () => {
      const buttons = alertSpy.mock.calls[0][2];
      return buttons?.find((b) => b.style === "destructive");
    };

    it("does nothing when the picker is cancelled", async () => {
      picker.getDocumentAsync.mockResolvedValue({ canceled: true, assets: null } as never);
      await mountSettings();
      await fireEvent.press(screen.getByLabelText("Geri yükle"));
      await waitFor(() => expect(picker.getDocumentAsync).toHaveBeenCalled());
      expect(alertSpy).not.toHaveBeenCalled();
    });

    it("shows an error for a file that is not a valid backup", async () => {
      pickFile(JSON.stringify({ app: "other" }));
      await mountSettings();
      await fireEvent.press(screen.getByLabelText("Geri yükle"));
      await waitFor(() => expect(alertSpy).toHaveBeenCalledTimes(1));
      expect(alertSpy.mock.calls[0][0]).toBe("Geçersiz yedek");
      expect(alertSpy.mock.calls[0][1]).toContain("Bu dosya geçerli bir Bite Routine yedeği değil.");
      expect(alertSpy.mock.calls[0][2]).toBeUndefined();
    });

    it("shows an error for unparseable JSON and for unreadable files", async () => {
      pickFile("{nope");
      await mountSettings();
      await fireEvent.press(screen.getByLabelText("Geri yükle"));
      await waitFor(() => expect(alertSpy).toHaveBeenCalledTimes(1));

      picker.getDocumentAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri: "file:///missing.json", name: "missing.json" }],
      } as never);
      await fireEvent.press(screen.getByLabelText("Geri yükle"));
      expect(await screen.findByText("Dosya okunamadı.")).toBeTruthy();
    });

    it("confirms with counts, then replaces the data", async () => {
      pickFile(JSON.stringify(await sourceBackup()));
      const db = await mountSettings(async (d) => {
        await addEntry(d, {
          date: "2026-09-01",
          mealSlot: "snack",
          food: { kind: "food", id: "old" },
          foodName: "Eski kayıt",
          grams: 100,
          portion: null,
          per100g: { kcal: 10, protein: 1, carbs: 1, fat: 1 },
        });
      });
      await fireEvent.press(screen.getByLabelText("Geri yükle"));
      await waitFor(() => expect(alertSpy).toHaveBeenCalledTimes(1));
      expect(alertSpy.mock.calls[0][1]).toContain("1 günlük kaydı, 0 kendi yemeğin ve 1 gün");
      // Nothing changes before the user confirms.
      expect(await listEntriesInRange(db, "2026-01-01", "2026-12-31")).toHaveLength(1);
      expect((await listEntriesInRange(db, "2026-01-01", "2026-12-31"))[0].foodName).toBe("Eski kayıt");

      await act(async () => {
        confirmButton()?.onPress?.();
      });
      expect(await screen.findByText("Yedek geri yüklendi.")).toBeTruthy();
      const entries = await listEntriesInRange(db, "2026-01-01", "2026-12-31");
      expect(entries.map((e) => e.foodName)).toEqual(["Karnıyarık"]);
      expect((await getSettings(db)).waterGoalMl).toBe(3000);
    });

    it("keeps data when the user cancels the confirmation", async () => {
      pickFile(JSON.stringify(await sourceBackup()));
      const db = await mountSettings();
      await fireEvent.press(screen.getByLabelText("Geri yükle"));
      await waitFor(() => expect(alertSpy).toHaveBeenCalledTimes(1));
      expect(alertSpy.mock.calls[0][2]?.some((b) => b.style === "cancel")).toBe(true);
      expect(await listEntriesInRange(db, "2026-01-01", "2026-12-31")).toHaveLength(0);
    });
  });

  describe("delete all", () => {
    async function openDialog() {
      await fireEvent.press(screen.getByLabelText("Tüm verileri sil"));
      return await screen.findByLabelText("Onay sözcüğü");
    }

    it("requires the confirmation word before wiping", async () => {
      const db = await mountSettings();
      const input = await openDialog();
      const action = screen.getByLabelText("Hepsini sil");
      expect(action.props.accessibilityState.disabled).toBe(true);
      for (const wrong of ["", "SIL", "SİLL", "evet"]) {
        await fireEvent.changeText(input, wrong);
        expect(screen.getByLabelText("Hepsini sil").props.accessibilityState.disabled).toBe(true);
      }
      await fireEvent.press(screen.getByLabelText("Hepsini sil"));
      expect(await getProfile(db)).not.toBeNull();
      expect(notifications.cancelAllScheduledNotificationsAsync).not.toHaveBeenCalled();
    });

    it("wipes data and cancels notifications once the word is typed", async () => {
      const db = await mountSettings(async (d) => {
        await saveSettings(d, { language: null, waterGoalMl: 2000, reminders: [] });
      });
      const input = await openDialog();
      await fireEvent.changeText(input, "SİL");
      expect(screen.getByLabelText("Hepsini sil").props.accessibilityState.disabled).toBe(false);
      await fireEvent.press(screen.getByLabelText("Hepsini sil"));
      await waitFor(async () => expect(await getProfile(db)).toBeNull());
      expect(notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(screen.queryByLabelText("Onay sözcüğü")).toBeNull());
    });

    it("can be cancelled", async () => {
      const db = await mountSettings();
      await openDialog();
      await fireEvent.press(screen.getByLabelText("Vazgeç"));
      await waitFor(() => expect(screen.queryByLabelText("Onay sözcüğü")).toBeNull());
      expect(await getProfile(db)).not.toBeNull();
    });
  });
});
