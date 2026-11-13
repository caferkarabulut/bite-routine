import { Redirect, Tabs } from "expo-router";
import { Text } from "react-native";

import { useI18n } from "../../i18n";
import { useAppState } from "../../state/AppState";
import { colors } from "../../ui";

const ICONS: Record<string, string> = { index: "◉", catalog: "⌕", history: "▤", settings: "⚙" };

export default function TabsLayout() {
  const { t } = useI18n();
  const { profile } = useAppState();
  if (!profile) return <Redirect href="/onboarding" />;
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>{ICONS[route.name] ?? "•"}</Text>,
      })}
    >
      <Tabs.Screen name="index" options={{ title: t("tabs.today") }} />
      <Tabs.Screen name="catalog" options={{ title: t("tabs.catalog") }} />
      <Tabs.Screen name="history" options={{ title: t("tabs.history") }} />
      <Tabs.Screen name="settings" options={{ title: t("tabs.settings") }} />
    </Tabs>
  );
}
