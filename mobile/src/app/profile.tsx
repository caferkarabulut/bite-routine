import { Stack } from "expo-router";

import { ProfileScreen } from "../features/profile/ProfileScreen";

export default function Route() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ProfileScreen />
    </>
  );
}
