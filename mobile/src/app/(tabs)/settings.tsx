import { Tabs } from "expo-router";

import { SettingsScreen } from "../../features/settings/SettingsScreen";

export default function Route() {
  return (
    <>
      <Tabs.Screen options={{ headerShown: false }} />
      <SettingsScreen />
    </>
  );
}
