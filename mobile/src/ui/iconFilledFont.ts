// Material Symbols ships outline and filled glyphs as separate fonts; expo-symbols only exposes the outline
// weights. The filled 400 font comes from @expo-google-fonts/material-symbols, which expo-symbols itself
// depends on (it is not a separate dependency of the app).
import { MaterialSymbols_400Regular_Filled } from "@expo-google-fonts/material-symbols/400Regular_Filled";

export const filledAndroidWeight = {
  ios: "unspecified" as const,
  android: { name: "MaterialSymbols_400Regular_Filled", font: MaterialSymbols_400Regular_Filled as number },
};
