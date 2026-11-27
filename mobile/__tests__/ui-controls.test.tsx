import { fireEvent, render, screen } from "@testing-library/react-native";
import { useState } from "react";
import { Text } from "react-native";

import { I18nProvider } from "../src/i18n";
import {
  Button,
  Card,
  Chip,
  clampProgress,
  formatStepperValue,
  formatTime,
  Icon,
  IconButton,
  ListRow,
  MacroBar,
  parseStepperText,
  ProgressRing,
  SearchBar,
  SectionHeader,
  SegmentedControl,
  SettingsRow,
  Stepper,
  stepValue,
  timeToDate,
  dateToTime,
} from "../src/ui";

function tr(ui: React.ReactElement) {
  return render(<I18nProvider language="tr">{ui}</I18nProvider>);
}

describe("Icon", () => {
  it("is hidden from accessibility by default", async () => {
    await render(<Icon name="today" testID="icon" />);
    const icon = screen.getByTestId("icon", { includeHiddenElements: true });
    expect(icon.props.accessible).toBe(false);
    expect(icon.props.importantForAccessibility).toBe("no-hide-descendants");
  });

  it("is announced as an image when labelled", async () => {
    await render(<Icon name="heart" accessibilityLabel="Favori" />);
    expect(screen.getByRole("image", { name: "Favori" })).toBeTruthy();
  });
});

describe("Button / IconButton", () => {
  it("keeps the old API and adds an icon", async () => {
    const onPress = jest.fn();
    await render(<Button label="Kaydet" onPress={onPress} icon="check" size="md" />);
    await fireEvent.press(screen.getByRole("button", { name: "Kaydet" }));
    expect(onPress).toHaveBeenCalled();
  });

  it("small buttons extend their touch area to the minimum", async () => {
    await render(<Button label="Küçük" onPress={() => {}} size="sm" />);
    expect(screen.getByRole("button", { name: "Küçük" }).props.hitSlop).toBeGreaterThan(0);
  });

  it("IconButton requires a label and reports disabled", async () => {
    const onPress = jest.fn();
    await render(<IconButton icon="trash" accessibilityLabel="Sil" onPress={onPress} disabled />);
    const button = screen.getByRole("button", { name: "Sil" });
    expect(button.props.accessibilityState).toMatchObject({ disabled: true });
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe("SectionHeader", () => {
  it("renders a header and the add action", async () => {
    const onPress = jest.fn();
    await render(
      <SectionHeader title="Kahvaltı" detail="137 kcal" action={{ accessibilityLabel: "Kahvaltıya ekle", onPress, testID: "add-breakfast" }} />,
    );
    expect(screen.getByRole("header")).toHaveTextContent("Kahvaltı  137 kcal");
    await fireEvent.press(screen.getByTestId("add-breakfast"));
    expect(onPress).toHaveBeenCalled();
  });
});

describe("Card / ListRow", () => {
  it("Card still accepts a style", async () => {
    await render(
      <Card style={{ backgroundColor: "red" }}>
        <Text>x</Text>
      </Card>,
    );
    expect(screen.getByText("x")).toBeTruthy();
  });

  it("ListRow keeps the combined label and adds a separate trailing action", async () => {
    const onPress = jest.fn();
    const onAdd = jest.fn();
    await render(
      <ListRow
        title="Ayran"
        subtitle="Yemek · 1 bardak"
        right="61 kcal"
        leading="water"
        onPress={onPress}
        trailing={<IconButton icon="add" accessibilityLabel="Ayran ekle" onPress={onAdd} />}
      />,
    );
    await fireEvent.press(screen.getByRole("button", { name: "Ayran, Yemek · 1 bardak, 61 kcal" }));
    await fireEvent.press(screen.getByRole("button", { name: "Ayran ekle" }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledTimes(1);
  });
});

describe("SearchBar", () => {
  function Harness({ onCancel }: { onCancel?: () => void }) {
    const [q, setQ] = useState("");
    return <SearchBar value={q} onChangeText={setQ} placeholder="Yemek ara" testID="search" onCancel={onCancel} />;
  }

  it("passes the testID, clears with ×, and shows İptal when there is text", async () => {
    const onCancel = jest.fn();
    await tr(<Harness onCancel={onCancel} />);
    expect(screen.queryByRole("button", { name: "Aramayı temizle" })).toBeNull();
    await fireEvent.changeText(screen.getByTestId("search"), "çay");
    expect(screen.getByTestId("search").props.value).toBe("çay");
    await fireEvent.press(screen.getByRole("button", { name: "İptal" }));
    expect(onCancel).toHaveBeenCalled();
    await fireEvent.press(screen.getByRole("button", { name: "Aramayı temizle" }));
    expect(screen.getByTestId("search").props.value).toBe("");
  });
});

describe("SegmentedControl / Chip", () => {
  it("is a radio group with one checked option", async () => {
    const onChange = jest.fn();
    await render(
      <SegmentedControl
        accessibilityLabel="Liste"
        value="all"
        onChange={onChange}
        options={[
          { value: "all", label: "Tümü" },
          { value: "fav", label: "Favoriler" },
        ]}
      />,
    );
    expect(screen.getByLabelText("Liste").props.accessibilityRole).toBe("radiogroup");
    expect(screen.getByRole("radio", { name: "Tümü" }).props.accessibilityState).toMatchObject({ checked: true });
    await fireEvent.press(screen.getByRole("radio", { name: "Tümü" }));
    expect(onChange).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole("radio", { name: "Favoriler" }));
    expect(onChange).toHaveBeenCalledWith("fav");
  });

  it("Chip reports selection only when it is a toggle", async () => {
    await render(
      <>
        <Chip label="Çorbalar" onPress={() => {}} />
        <Chip label="Gram" onPress={() => {}} selected accessibilityRole="radio" />
      </>,
    );
    expect(screen.getByRole("button", { name: "Çorbalar" }).props.accessibilityState?.selected).toBeUndefined();
    expect(screen.getByRole("radio", { name: "Gram" }).props.accessibilityState).toMatchObject({ checked: true });
  });
});

describe("Stepper", () => {
  const range = { min: 0, max: 10, step: 0.5 };

  it("parses comma and dot decimals and zero", () => {
    expect(parseStepperText("1,5")).toBe(1.5);
    expect(parseStepperText("1.5")).toBe(1.5);
    expect(parseStepperText("0")).toBe(0);
    expect(parseStepperText("0,0")).toBe(0);
    expect(parseStepperText("1,2,3")).toBeNull();
    expect(parseStepperText("abc")).toBeNull();
  });

  it("steps without floating point noise and clamps to the range", () => {
    expect(stepValue("1,5", 1, range)).toBe(2);
    expect(stepValue("0.1", 1, { min: 0, max: 10, step: 0.2 })).toBe(0.3);
    expect(stepValue("1,25", -1, range)).toBe(0.75);
    expect(stepValue("0,25", -1, range)).toBe(0);
    expect(stepValue("9,8", 1, range)).toBe(10);
    expect(stepValue("", 1, range)).toBe(0);
  });

  it("writes the language's decimal separator without grouping", () => {
    expect(formatStepperValue(1.5, "tr")).toBe("1,5");
    expect(formatStepperValue(1.5, "en")).toBe("1.5");
    expect(formatStepperValue(1000, "tr")).toBe("1000");
  });

  function Harness({ initial, max = 10 }: { initial: string; max?: number }) {
    const [v, setV] = useState(initial);
    return <Stepper value={v} onChangeText={setV} label="Miktar" min={0.5} max={max} step={0.5} testID="amount-input" />;
  }

  it("increments with a comma in Turkish and disables at the limits", async () => {
    await tr(<Harness initial="1,5" max={2} />);
    const input = screen.getByTestId("amount-input");
    expect(input.props.keyboardType).toBe("decimal-pad");
    await fireEvent.press(screen.getByRole("button", { name: "Artır" }));
    expect(screen.getByTestId("amount-input").props.value).toBe("2");
    expect(screen.getByRole("button", { name: "Artır" }).props.accessibilityState).toMatchObject({ disabled: true });
    await fireEvent.press(screen.getByRole("button", { name: "Azalt" }));
    expect(screen.getByTestId("amount-input").props.value).toBe("1,5");
  });

  it("lets the user type freely", async () => {
    await tr(<Harness initial="1" />);
    await fireEvent.changeText(screen.getByTestId("amount-input"), "2,");
    expect(screen.getByTestId("amount-input").props.value).toBe("2,");
  });
});

describe("ProgressRing / MacroBar", () => {
  it("clamps values to 0..1", () => {
    expect(clampProgress(-1)).toBe(0);
    expect(clampProgress(2)).toBe(1);
    expect(clampProgress(Number.NaN)).toBe(0);
    expect(clampProgress(0.25)).toBe(0.25);
  });

  it("is a progressbar with the clamped value and centered children", async () => {
    await render(
      <ProgressRing value={1.7} accessibilityLabel="Kalori" testID="ring">
        <Text>2.415</Text>
      </ProgressRing>,
    );
    const ring = screen.getByRole("progressbar", { name: "Kalori" });
    expect(ring.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 100 });
    expect(screen.getByText("2.415")).toBeTruthy();
  });

  it("draws no arc at zero", async () => {
    await render(<ProgressRing value={0} testID="ring" />);
    expect(screen.queryByTestId("ring-arc")).toBeNull();
  });

  it("uses spoken text when given", async () => {
    await render(<ProgressRing value={0.5} accessibilityLabel="Kalori" accessibilityValueText="2.415 kcal kaldı" />);
    expect(screen.getByRole("progressbar", { name: "Kalori" }).props.accessibilityValue).toEqual({ text: "2.415 kcal kaldı" });
  });

  it("MacroBar reads value and target", async () => {
    await tr(<MacroBar label="Protein" value={12.4} target={94} />);
    const bar = screen.getByRole("progressbar", { name: "Protein" });
    expect(bar.props.accessibilityValue).toEqual({ text: "12 / 94 g" });
  });
});

describe("SettingsRow", () => {
  it("switch rows toggle", async () => {
    const onChange = jest.fn();
    await render(<SettingsRow title="Hatırlatıcı" switchValue={false} onSwitchChange={onChange} testID="sw" />);
    await fireEvent(screen.getByTestId("sw"), "valueChange", true);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("value rows are buttons", async () => {
    const onPress = jest.fn();
    await render(<SettingsRow title="Dil" value="Türkçe" onPress={onPress} />);
    await fireEvent.press(screen.getByRole("button", { name: "Dil, Türkçe" }));
    expect(onPress).toHaveBeenCalled();
  });
});

describe("TimeField helpers", () => {
  it("formats and converts hour:minute", () => {
    expect(formatTime({ hour: 7, minute: 5 })).toBe("07:05");
    const d = timeToDate({ hour: 21, minute: 30 }, new Date(2026, 10, 26, 8, 0));
    expect(dateToTime(d)).toEqual({ hour: 21, minute: 30 });
    expect(d.getDate()).toBe(26);
  });
});
