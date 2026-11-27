import { Stack } from "expo-router";

import { WeightScreen } from "../features/history/WeightScreen";

export default function WeightRoute() {
  return <><Stack.Screen options={{ headerShown: false }} /><WeightScreen /></>;
}
