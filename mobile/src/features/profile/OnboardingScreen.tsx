import { router } from "expo-router";
import { useState } from "react";
import { Keyboard, Text, View } from "react-native";

import { todayInIstanbul } from "../../domain";
import { useI18n } from "../../i18n";
import { useAppState } from "../../state/AppState";
import { Button, colors, spacing, typography } from "../../ui";
import { FormScreen, ProfileFields, TargetsCard } from "./ProfileForm";
import { EMPTY_VALUES, useProfileForm } from "./useProfileForm";

export function OnboardingScreen() {
  const { t } = useI18n();
  const { saveProfile } = useAppState();
  const today = todayInIstanbul();
  const currentYear = Number(today.slice(0, 4));
  const form = useProfileForm(EMPTY_VALUES, currentYear, today);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const submit = async () => {
    form.markAttempted();
    if (!form.input || saving) return;
    Keyboard.dismiss();
    setSaving(true);
    setSaveError(false);
    try {
      await saveProfile(form.input);
      router.replace("/");
    } catch {
      setSaveError(true);
      setSaving(false);
    }
  };

  return (
    <FormScreen
      title={t("features.profile.formTitle")}
      subtitle={<Text style={[typography.label, { color: colors.accentText, textAlign: "center" }]}>{t("app.name")}</Text>}
      headerBelow={<Text style={[typography.muted, { textAlign: "center" }]}>{t("features.profile.welcomeText")}</Text>}
      footer={
        <View style={{ gap: spacing.sm }}>
          <Text style={[typography.small, { textAlign: "center" }]}>{t("disclaimer")}</Text>
          {form.attempted && !form.input ? (
            <Text accessibilityRole="alert" style={[typography.small, { color: colors.danger }]}>
              {t("features.profile.fixErrors")}
            </Text>
          ) : null}
          {saveError ? (
            <Text accessibilityRole="alert" style={[typography.small, { color: colors.danger }]}>
              {t("errors.saveFailed")}
            </Text>
          ) : null}
          <Button label={t("features.profile.start")} onPress={() => void submit()} loading={saving} />
        </View>
      }
    >
      <ProfileFields form={form} currentYear={currentYear} />
      <TargetsCard
        title={t(form.values.kcalOverride.trim() || form.values.proteinOverride.trim()
          ? "features.profile.resultTitle"
          : "features.profile.previewTitle")}
        form={form}
        currentYear={currentYear}
      />
    </FormScreen>
  );
}
