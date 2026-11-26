import { fireEvent, render, screen } from "@testing-library/react-native";
import { Alert, Pressable, Text } from "react-native";

import { I18nProvider } from "../src/i18n";
import { useUnsavedChangesGuard } from "../src/ui";
import { attemptLeave, guard, resetGuard } from "./helpers/prevent-remove";

jest.mock("expo-router", () => ({ usePreventRemove: require("./helpers/prevent-remove").usePreventRemove }));

function Probe({ dirty }: { dirty: boolean }) {
  const allowLeave = useUnsavedChangesGuard(dirty);
  return (
    <Pressable accessibilityRole="button" onPress={allowLeave}>
      <Text>save</Text>
    </Pressable>
  );
}

const renderProbe = (dirty: boolean, language: "tr" | "en" = "tr") =>
  render(
    <I18nProvider language={language}>
      <Probe dirty={dirty} />
    </I18nProvider>,
  );

beforeEach(() => {
  resetGuard();
  jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

describe("useUnsavedChangesGuard", () => {
  it("lets a clean screen leave without a prompt", async () => {
    await renderProbe(false);
    expect(guard.active).toBe(false);
    expect(attemptLeave()).toBe(true);
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it("blocks a dirty screen and asks in Turkish", async () => {
    await renderProbe(true);
    expect(guard.active).toBe(true);
    expect(attemptLeave()).toBe(false);
    expect(Alert.alert).toHaveBeenCalledWith("Kaydedilmemiş değişiklikler", "Yaptığın değişiklikler kaydedilmeyecek.", [
      { text: "Düzenlemeye devam et", style: "cancel" },
      { text: "Çık", style: "destructive", onPress: expect.any(Function) },
    ]);
    expect(guard.repeat).not.toHaveBeenCalled();
  });

  it("asks in English", async () => {
    await renderProbe(true, "en");
    attemptLeave();
    const [title, message, buttons] = (Alert.alert as jest.Mock).mock.calls[0];
    expect([title, message]).toEqual(["Unsaved changes", "Your changes will not be saved."]);
    expect(buttons.map((b: { text: string }) => b.text)).toEqual(["Keep editing", "Discard"]);
  });

  it("stays when the user keeps editing, and leaves on discard", async () => {
    await renderProbe(true);
    attemptLeave();
    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as { text: string; onPress?: () => void }[];
    expect(buttons[0].onPress).toBeUndefined();
    expect(guard.repeat).not.toHaveBeenCalled();

    buttons[1].onPress?.();
    expect(guard.repeat).toHaveBeenCalledTimes(1);
  });

  it("turns the guard off for the redirect that follows a save", async () => {
    await renderProbe(true);
    expect(attemptLeave()).toBe(false);
    (Alert.alert as jest.Mock).mockClear();

    await fireEvent.press(screen.getByRole("button", { name: "save" }));
    expect(guard.disable).toHaveBeenCalledTimes(1);
    expect(guard.active).toBe(false);
    expect(attemptLeave()).toBe(true);
    expect(Alert.alert).not.toHaveBeenCalled();
  });
});
