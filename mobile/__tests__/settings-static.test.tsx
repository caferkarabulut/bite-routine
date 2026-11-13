import { fireEvent, render, screen } from "@testing-library/react-native";
import { Linking } from "react-native";

import { PrivacyScreen } from "../src/features/settings/PrivacyScreen";
import { SourcesScreen } from "../src/features/settings/SourcesScreen";
import { I18nProvider } from "../src/i18n";
import type { Language } from "../src/types";

jest.mock("expo-localization", () => ({ useLocales: () => [{ languageCode: "tr", languageTag: "tr-TR" }] }));

let openURL: jest.SpiedFunction<typeof Linking.openURL>;
beforeEach(() => {
  openURL = jest.spyOn(Linking, "openURL").mockResolvedValue();
});
afterEach(() => {
  openURL.mockRestore();
});

const renderIn = async (lang: Language, ui: React.ReactElement) =>
  await render(<I18nProvider language={lang}>{ui}</I18nProvider>);

describe("SourcesScreen", () => {
  it("credits USDA and Open Food Facts and opens the links", async () => {
    await renderIn("tr", <SourcesScreen />);
    expect(screen.getByText("Open Food Facts katkıcıları, ODbL")).toBeTruthy();
    expect(screen.getByText("USDA FoodData Central")).toBeTruthy();
    expect(screen.getAllByText(/yaklaşık/).length).toBeGreaterThan(0);
    await fireEvent.press(screen.getByLabelText("Open Food Facts sitesini aç"));
    expect(openURL).toHaveBeenCalledWith("https://world.openfoodfacts.org");
    await fireEvent.press(screen.getByLabelText("ODbL lisansını aç"));
    expect(openURL).toHaveBeenCalledWith("https://opendatacommons.org/licenses/odbl/1-0/");
    await fireEvent.press(screen.getByLabelText("FoodData Central sitesini aç"));
    expect(openURL).toHaveBeenCalledWith("https://fdc.nal.usda.gov");
  });
});

describe("PrivacyScreen", () => {
  it.each([
    ["tr", "Hesap yok.", "GitHub sayfası"],
    ["en", "No account.", "GitHub page"],
  ] as const)("explains local-only data in %s", async (lang, text, button) => {
    await renderIn(lang, <PrivacyScreen />);
    expect(screen.getByText(new RegExp(text))).toBeTruthy();
    await fireEvent.press(screen.getByLabelText(button));
    expect(openURL).toHaveBeenCalledWith("https://github.com/caferkarabulut/bite-routine");
  });
});
