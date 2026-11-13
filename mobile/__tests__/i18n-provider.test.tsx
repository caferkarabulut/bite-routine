import { act, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { I18nProvider, useI18n } from "../src/i18n";
import type { Language } from "../src/types";

const mockUseLocales = jest.fn();
jest.mock("expo-localization", () => ({ useLocales: () => mockUseLocales() }));

let api: ReturnType<typeof useI18n>;
function Probe() {
  api = useI18n();
  return (
    <>
      <Text testID="lang">{api.lang}</Text>
      <Text testID="today">{api.t("tabs.today")}</Text>
    </>
  );
}

function setDevice(code: string | null) {
  mockUseLocales.mockReturnValue([{ languageCode: code, languageTag: code ?? "" }]);
}

async function renderWith(language: Language | null, onLanguageChange?: (l: Language | null) => void) {
  return await render(
    <I18nProvider language={language} onLanguageChange={onLanguageChange}>
      <Probe />
    </I18nProvider>,
  );
}

describe("I18nProvider", () => {
  it("follows an English device when settings language is null", async () => {
    setDevice("en");
    await renderWith(null);
    expect(screen.getByTestId("lang").props.children).toBe("en");
    expect(screen.getByTestId("today").props.children).toBe("Today");
  });

  it("falls back to Turkish for other device languages", async () => {
    setDevice("de");
    await renderWith(null);
    expect(screen.getByTestId("lang").props.children).toBe("tr");
    expect(screen.getByTestId("today").props.children).toBe("Bugün");
  });

  it("falls back to Turkish when the device language code is null", async () => {
    setDevice(null);
    await renderWith(null);
    expect(screen.getByTestId("lang").props.children).toBe("tr");
  });

  it("lets the explicit setting beat the device language", async () => {
    setDevice("en");
    await renderWith("tr");
    expect(screen.getByTestId("lang").props.children).toBe("tr");
  });

  it("setLanguage switches immediately and notifies the caller", async () => {
    setDevice("tr");
    const onChange = jest.fn();
    await renderWith(null, onChange);
    await act(async () => api.setLanguage("en"));
    expect(screen.getByTestId("lang").props.children).toBe("en");
    expect(onChange).toHaveBeenCalledWith("en");
    await act(async () => api.setLanguage(null));
    expect(screen.getByTestId("lang").props.children).toBe("tr");
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("applies a new language prop after a local choice", async () => {
    setDevice("tr");
    const view = await renderWith(null);
    await act(async () => api.setLanguage("en"));
    await view.rerender(
      <I18nProvider language="tr">
        <Probe />
      </I18nProvider>,
    );
    expect(screen.getByTestId("lang").props.children).toBe("tr");
  });

  it("throws outside a provider", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(render(<Probe />)).rejects.toThrow(/I18nProvider/);
    spy.mockRestore();
  });
});
