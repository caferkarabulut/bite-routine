import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Text } from "react-native";

import { importBackup, useDb, wipeAllData } from "../../db";
import { parseAmount } from "../../domain";
import { formatKcal, useI18n } from "../../i18n";
import type { Language } from "../../types";
import { Button, Card, ChoiceChips, colors, ListRow, Screen, SectionTitle, TextField, typography } from "../../ui";
import { useAppState } from "../../state/AppState";
import { backupCounts, createAndShareBackup, pickBackup, ShareUnavailableError } from "./backupFiles";
import { DeleteAllModal } from "./DeleteAllModal";
import { cancelAllReminders, syncReminders } from "./reminders";
import { RemindersSection } from "./RemindersSection";

type Status = { kind: "ok" | "error"; text: string } | null;
type LanguageChoice = "system" | Language;

export const WATER_MIN = 500;
export const WATER_MAX = 6000;

export function SettingsScreen() {
  const { t, lang, setLanguage } = useI18n();
  const db = useDb();
  const router = useRouter();
  const { settings, targets, saveSettings, reload } = useAppState();

  const [waterText, setWaterText] = useState(String(settings.waterGoalMl));
  const [waterError, setWaterError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Notification text is localized, so reschedule when the language changes.
  const lastLang = useRef(lang);
  useEffect(() => {
    if (lastLang.current === lang) return;
    lastLang.current = lang;
    if (settings.reminders.some((r) => r.enabled)) void syncReminders(settings.reminders, lang).catch(() => {});
  }, [lang, settings.reminders]);

  function saveWater() {
    const n = parseAmount(waterText);
    if (n === null || !Number.isInteger(n) || n < WATER_MIN || n > WATER_MAX) {
      setWaterError(t("features.settings.waterGoalError"));
      setStatus(null);
      return;
    }
    setWaterError(null);
    saveSettings({ ...settings, waterGoalMl: n }).then(
      () => setStatus({ kind: "ok", text: t("features.settings.waterGoalSaved") }),
      () => setStatus({ kind: "error", text: t("errors.saveFailed") }),
    );
  }

  async function backup() {
    setBusy(true);
    setStatus(null);
    try {
      await createAndShareBackup(db);
      setStatus({ kind: "ok", text: t("settings.backupDone") });
    } catch (e) {
      const text = e instanceof ShareUnavailableError ? t("features.settings.shareUnavailable") : t("features.settings.backupFailed");
      setStatus({ kind: "error", text });
    } finally {
      setBusy(false);
    }
  }

  async function restore() {
    setBusy(true);
    setStatus(null);
    try {
      const picked = await pickBackup();
      if (picked.status === "canceled") return;
      if (picked.status === "invalid") {
        Alert.alert(
          t("features.settings.restoreInvalidTitle"),
          `${t("settings.restoreInvalid")}\n\n${picked.errors.slice(0, 3).join("\n")}`,
        );
        return;
      }
      const backup = picked.backup;
      const counts = backupCounts(backup);
      Alert.alert(t("features.settings.restoreConfirmTitle"), t("features.settings.restoreCounts", counts), [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("settings.restore"),
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await importBackup(db, backup);
                // The restored reminders replace the old ones; reschedule when permission allows.
                await syncReminders(backup.settings.reminders, lang).catch(() => {});
                reload();
                setStatus({ kind: "ok", text: t("settings.restoreDone") });
              } catch {
                setStatus({ kind: "error", text: t("features.settings.restoreFailed") });
              }
            })();
          },
        },
      ]);
    } catch {
      setStatus({ kind: "error", text: t("errors.fileRead") });
    } finally {
      setBusy(false);
    }
  }

  async function deleteAll() {
    setBusy(true);
    try {
      await wipeAllData(db);
      await cancelAllReminders().catch(() => {});
      setDeleteOpen(false);
      reload();
    } catch {
      setDeleteOpen(false);
      setStatus({ kind: "error", text: t("features.settings.deleteAllFailed") });
    } finally {
      setBusy(false);
    }
  }

  const choice: LanguageChoice = settings.language ?? "system";
  const version = Constants.expoConfig?.version ?? "";

  return (
    <Screen>
      <SectionTitle>{t("features.settings.sectionProfile")}</SectionTitle>
      <Card>
        <ListRow
          title={t("settings.profile")}
          subtitle={targets ? t("features.settings.targetLine", { kcal: formatKcal(targets.kcal, lang) }) : t("features.settings.noProfile")}
          right="›"
          onPress={() => router.push("/profile")}
        />
      </Card>

      <SectionTitle>{t("features.settings.sectionLanguage")}</SectionTitle>
      <Card>
        <ChoiceChips<LanguageChoice>
          label={t("settings.language")}
          options={[
            { value: "system", label: t("settings.languageSystem") },
            { value: "tr", label: t("settings.languageTr") },
            { value: "en", label: t("settings.languageEn") },
          ]}
          value={choice}
          onChange={(v) => setLanguage(v === "system" ? null : v)}
        />
      </Card>

      <SectionTitle>{t("features.settings.sectionWater")}</SectionTitle>
      <Card>
        <TextField
          label={t("settings.waterGoal")}
          value={waterText}
          onChangeText={setWaterText}
          keyboardType="number-pad"
          inputMode="numeric"
          suffix="ml"
          error={waterError}
        />
        <Button label={t("common.save")} variant="secondary" onPress={saveWater} />
      </Card>

      <SectionTitle>{t("features.settings.sectionReminders")}</SectionTitle>
      <RemindersSection
        reminders={settings.reminders}
        onChange={(reminders) => saveSettings({ ...settings, reminders })}
      />

      <SectionTitle>{t("features.settings.sectionData")}</SectionTitle>
      <Card>
        <Text style={typography.muted}>{t("settings.backupHint")}</Text>
        <Button label={t("settings.backup")} variant="secondary" disabled={busy} onPress={() => void backup()} />
        <Text style={typography.muted}>{t("settings.restoreHint")}</Text>
        <Button label={t("settings.restore")} variant="secondary" disabled={busy} onPress={() => void restore()} />
        <Text style={typography.muted}>{t("settings.deleteAllHint")}</Text>
        <Button label={t("settings.deleteAll")} variant="danger" disabled={busy} onPress={() => setDeleteOpen(true)} />
      </Card>
      {status ? (
        <Text
          accessibilityRole={status.kind === "error" ? "alert" : undefined}
          style={[typography.body, { color: status.kind === "error" ? colors.danger : colors.primary }]}
        >
          {status.text}
        </Text>
      ) : null}

      <SectionTitle>{t("features.settings.sectionAbout")}</SectionTitle>
      <Card>
        <ListRow title={t("settings.sources")} right="›" onPress={() => router.push("/sources")} />
        <ListRow title={t("settings.privacy")} right="›" onPress={() => router.push("/privacy")} />
        {version ? <Text style={typography.muted}>{t("settings.version", { version })}</Text> : null}
        <Text style={typography.small}>{t("disclaimer")}</Text>
      </Card>

      <DeleteAllModal
        visible={deleteOpen}
        busy={busy}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void deleteAll()}
      />
    </Screen>
  );
}
