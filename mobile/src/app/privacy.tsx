import { Stack } from "expo-router";

import { PrivacyScreen } from "../features/settings/PrivacyScreen";

export default function Route() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <PrivacyScreen />
    </>
  );
}
