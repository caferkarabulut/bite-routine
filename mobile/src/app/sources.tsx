import { Stack } from "expo-router";

import { SourcesScreen } from "../features/settings/SourcesScreen";

export default function Route() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SourcesScreen />
    </>
  );
}
