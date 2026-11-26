import { router } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";

import { todayInIstanbul } from "../../domain";
import { useI18n } from "../../i18n";
import { useAppState } from "../../state/AppState";
import { Button, SectionTitle, colors, typography } from "../../ui";
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
    if (!form.input) return;
    setSaving(true);
    setSaveError(false);
    try {
      await saveProfile({ ...form.input, kcalOverride: null, proteinOverride: null });
      router.replace("/");
    } catch {
      setSaveError(true);
      setSaving(false);
    }
  };

  return (
    <FormScreen top>
      <Text accessibilityRole="header" style={typography.title}>
        {t("app.name")}
      </Text>
      <Text style={typography.body}>{t("features.profile.welcomeText")}</Text>
      <SectionTitle>{t("features.profile.formTitle")}</SectionTitle>
      <ProfileFields form={form} currentYear={currentYear} />
      <TargetsCard
        title={t("features.profile.previewTitle")}
        targets={form.calculated}
        empty={t("features.profile.previewEmpty")}
      />
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
      <Button label={t("features.profile.start")} onPress={submit} loading={saving} />
    </FormScreen>
  );
}
