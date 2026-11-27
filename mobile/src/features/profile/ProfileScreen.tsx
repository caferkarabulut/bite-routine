import { router } from "expo-router";
import { useState } from "react";
import { Keyboard, Text, View } from "react-native";

import { todayInIstanbul } from "../../domain";
import { useI18n } from "../../i18n";
import { useAppState } from "../../state/AppState";
import { Button, IconButton, colors, spacing, typography, useUnsavedChangesGuard } from "../../ui";
import { FormScreen, ProfileFields, TargetsCard } from "./ProfileForm";
import { EMPTY_VALUES, useProfileForm, valuesFromProfile, type ProfileFormValues } from "./useProfileForm";

export function ProfileScreen() {
  const { t } = useI18n();
  const { profile, saveProfile } = useAppState();
  const today = todayInIstanbul();
  const currentYear = Number(today.slice(0, 4));
  const form = useProfileForm(profile ? valuesFromProfile(profile) : EMPTY_VALUES, currentYear, today);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [savedValues, setSavedValues] = useState<ProfileFormValues | null>(null);
  useUnsavedChangesGuard(form.isDirty);
  const updated = savedValues === form.values;

  const submit = async () => {
    form.markAttempted();
    if (!form.input || saving) return;
    const submittedValues = form.values;
    Keyboard.dismiss();
    setSaving(true);
    setSaveError(false);
    try {
      await saveProfile(form.input);
      form.markSaved(submittedValues);
      setSavedValues(submittedValues);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormScreen
      title={t("features.profile.title")}
      subtitle={t("features.profile.formTitle")}
      headerLeft={<IconButton icon="chevronLeft" accessibilityLabel={t("common.back")} onPress={() => router.back()} />}
      footer={
        <View style={{ gap: spacing.sm }}>
          <Text style={[typography.small, { textAlign: "center" }]}>{t("features.profile.updateHint")}</Text>
          {updated ? <Text accessibilityLiveRegion="polite" style={[typography.label, { color: colors.successText, textAlign: "center" }]}>{t("features.profile.updated")}</Text> : null}
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
          <Button label={t("features.profile.update")} onPress={() => void submit()} loading={saving} />
        </View>
      }
    >
      <ProfileFields form={form} currentYear={currentYear} />
      <TargetsCard
        title={t("features.profile.resultTitle")}
        form={form}
        currentYear={currentYear}
      />
      <Text style={typography.small}>{t("disclaimer")}</Text>
    </FormScreen>
  );
}
