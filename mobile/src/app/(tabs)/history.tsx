import { Tabs } from "expo-router";

import { HistoryScreen } from "../../features/history/HistoryScreen";

export default function HistoryRoute() {
  return <><Tabs.Screen options={{ headerShown: false }} /><HistoryScreen /></>;
}
