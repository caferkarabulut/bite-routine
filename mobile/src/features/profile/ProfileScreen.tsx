import { router } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";

import { todayInIstanbul } from "../../domain";
import { useI18n } from "../../i18n";
import { useAppState } from "../../state/AppState";
import { Button, colors, typography } from "../../ui";
import { FormScreen, OverrideFields, ProfileFields, TargetsCard } from "./ProfileForm";
import { EMPTY_VALUES, useProfileForm, valuesFromProfile } from "./useProfileForm";

export function ProfileScreen() {
  const { t } = useI18n();
  const { profile, saveProfile } = useAppState();
  const today = todayInIstanbul();
  const currentYear = Number(today.slice(0, 4));
  const form = useProfileForm(profile ? valuesFromProfile(profile) : EMPTY_VALUES, currentYear, today);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const submit = async () => {
    form.markAttempted();
    if (!form.input) return;
    setSaving(true);
    setSaveError(false);
    try {
      await saveProfile(form.input);
      router.back();
    } catch {
      setSaveError(true);
      setSaving(false);
    }
  };

  return (
    <FormScreen>
      <Text style={typography.muted}>{t("profile.intro")}</Text>
      <ProfileFields form={form} currentYear={currentYear} />
      <OverrideFields form={form} calculated={form.calculated} currentYear={currentYear} />
      <TargetsCard
        title={t("features.profile.resultTitle")}
        targets={form.targets}
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
      <Button label={t("common.save")} onPress={submit} loading={saving} />
    </FormScreen>
  );
}
