import { Redirect, Tabs } from "expo-router";

import { useI18n } from "../../i18n";
import { useAppState } from "../../state/AppState";
import { colors, fonts, Icon, typography, type IconName } from "../../ui";

const TAB_ICONS: Record<string, IconName> = { index: "today", catalog: "catalog", history: "history", settings: "settings" };

export default function TabsLayout() {
  const { t } = useI18n();
  const { profile } = useAppState();
  if (!profile) return <Redirect href="/onboarding" />;
  return (
    <Tabs
      backBehavior="history"
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: fonts.bold },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: typography.caption,
        tabBarIcon: ({ color, focused }) => (
          <Icon name={TAB_ICONS[route.name] ?? "today"} size={24} color={color} filled={focused} />
        ),
      })}
    >
      {/* Today draws its own large title and day arrows. */}
      <Tabs.Screen name="index" options={{ title: t("tabs.today"), headerShown: false }} />
      <Tabs.Screen name="catalog" options={{ title: t("tabs.catalog") }} />
      <Tabs.Screen name="history" options={{ title: t("tabs.history") }} />
      <Tabs.Screen name="settings" options={{ title: t("tabs.settings") }} />
    </Tabs>
  );
}
