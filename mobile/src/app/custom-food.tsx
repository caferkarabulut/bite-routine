import { Stack } from "expo-router";

import { CustomFoodScreen } from "../features/catalog/CustomFoodScreen";

export default function CustomFoodRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <CustomFoodScreen />
    </>
  );
}
