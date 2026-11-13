import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, type ReactNode } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { DatabaseProvider } from "../db";
import { syncReminders } from "../features/settings/reminders";
import { I18nProvider, useI18n } from "../i18n";
import { AppStateProvider, useAppState } from "../state/AppState";
import { colors, ErrorState, Loading } from "../ui";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {/* Device language until settings are loaded. */}
      <I18nProvider language={null}>
        <DatabaseProvider fallback={<BootLoading />} renderError={(_, retry) => <BootError onRetry={retry} />}>
          <AppStateProvider>
            <SettingsLanguage>
              <RootStack />
            </SettingsLanguage>
          </AppStateProvider>
        </DatabaseProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}

function SettingsLanguage({ children }: { children: ReactNode }) {
  const { settings, saveSettings } = useAppState();
  return (
    <I18nProvider
      language={settings.language}
      onLanguageChange={(language) => void saveSettings({ ...settings, language })}
    >
      {children}
    </I18nProvider>
  );
}

function RootStack() {
  const { t, lang } = useI18n();
  const { status, reload, settings } = useAppState();

  // Re-register enabled reminders on start and whenever they or the language change.
  useEffect(() => {
    if (status === "ready") void syncReminders(settings.reminders, lang);
  }, [status, settings.reminders, lang]);

  if (status === "loading") return <BootLoading />;
  if (status === "error") return <BootError onRetry={reload} />;
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="profile" options={{ title: t("profile.title") }} />
      <Stack.Screen name="food/[id]" options={{ title: "" }} />
      <Stack.Screen name="custom-food" options={{ title: t("customFood.title"), presentation: "modal" }} />
      <Stack.Screen name="entry/[id]" options={{ title: t("common.edit") }} />
      <Stack.Screen name="weight" options={{ title: t("weight.title") }} />
      <Stack.Screen name="sources" options={{ title: t("sources.title") }} />
      <Stack.Screen name="privacy" options={{ title: t("settings.privacy") }} />
    </Stack>
  );
}

function BootLoading() {
  const { t } = useI18n();
  return <Loading label={t("common.loading")} />;
}

function BootError({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n();
  return <ErrorState message={t("errors.database")} retryLabel={t("errors.retry")} onRetry={onRetry} />;
}
