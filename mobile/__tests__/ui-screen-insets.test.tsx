import { render, screen } from "@testing-library/react-native";
import type { ReactElement } from "react";
import { StyleSheet, Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { Screen, useSideInsets } from "../src/ui";

const metrics = {
  frame: { x: 0, y: 0, width: 360, height: 800 },
  insets: { top: 24, bottom: 34, left: 0, right: 0 },
};

function scrollPaddingBottom(): number | undefined {
  const scroll = screen.getByTestId("screen-scroll");
  return StyleSheet.flatten(scroll.props.contentContainerStyle).paddingBottom as number | undefined;
}

function renderScreen(ui: ReactElement) {
  return render(<SafeAreaProvider initialMetrics={metrics}>{ui}</SafeAreaProvider>);
}

describe("Screen bottom inset", () => {
  it("pads the scroll content by the bottom inset by default", async () => {
    await renderScreen(
      <Screen>
        <Text>x</Text>
      </Screen>,
    );
    expect(scrollPaddingBottom()).toBe(34);
  });

  it("adds no bottom padding for tab screens (edges=[])", async () => {
    await renderScreen(
      <Screen edges={[]}>
        <Text>x</Text>
      </Screen>,
    );
    expect(scrollPaddingBottom()).toBe(0);
  });

  it("applies the bottom inset once when top and bottom edges are requested", async () => {
    await renderScreen(
      <Screen edges={["top", "bottom"]}>
        <Text>x</Text>
      </Screen>,
    );
    expect(scrollPaddingBottom()).toBe(34);
  });
});

describe("Screen footer", () => {
  it("moves the bottom inset from the scroll content to the sticky footer", async () => {
    await renderScreen(
      <Screen edges={["top", "bottom"]} footer={<Text>Ekle</Text>}>
        <Text>x</Text>
      </Screen>,
    );
    expect(scrollPaddingBottom()).toBe(0);
    expect(StyleSheet.flatten(screen.getByTestId("screen-footer").props.style).paddingBottom).toBe(34);
    expect(screen.getByText("Ekle")).toBeTruthy();
  });

  it("keeps a minimum footer padding without a bottom inset", async () => {
    await renderScreen(
      <Screen edges={[]} footer={<Text>Ekle</Text>}>
        <Text>x</Text>
      </Screen>,
    );
    expect(StyleSheet.flatten(screen.getByTestId("screen-footer").props.style).paddingBottom).toBe(12);
  });
});

describe("Screen side insets and large title", () => {
  const cover = {
    frame: { x: 0, y: 0, width: 390, height: 600 },
    insets: { top: 0, bottom: 20, left: 0, right: 56 },
  };

  it("pads the scroll content by the left/right insets on every screen kind", async () => {
    await render(
      <SafeAreaProvider initialMetrics={cover}>
        <Screen edges={[]}>
          <Text>x</Text>
        </Screen>
      </SafeAreaProvider>,
    );
    const style = StyleSheet.flatten(screen.getByTestId("screen-scroll").props.contentContainerStyle);
    expect(style.paddingRight).toBe(56);
    expect(style.paddingLeft).toBe(0);
    expect(style.paddingBottom).toBe(0);
  });

  it("useSideInsets adds the insets to a base padding (and works without a provider)", async () => {
    function Probe() {
      const s = useSideInsets(16);
      return <Text>{`${s.paddingLeft},${s.paddingRight}`}</Text>;
    }
    await render(
      <SafeAreaProvider initialMetrics={cover}>
        <Probe />
      </SafeAreaProvider>,
    );
    expect(screen.getByText("16,72")).toBeTruthy();
    await render(<Probe />);
    expect(screen.getByText("16,16")).toBeTruthy();
  });

  it("pads non-scrolling screens too", async () => {
    await render(
      <SafeAreaProvider initialMetrics={cover}>
        <Screen scroll={false}>
          <Text>x</Text>
        </Screen>
      </SafeAreaProvider>,
    );
    const style = StyleSheet.flatten(screen.getByTestId("screen-view").props.style);
    expect(style.paddingRight).toBe(56);
    expect(style.paddingBottom).toBe(20);
  });

  it("renders a large title header with subtitle and actions", async () => {
    await renderScreen(
      <Screen largeTitle="Bugün" subtitle="26 Kasım Perşembe" headerRight={<Text>sağ</Text>}>
        <Text>x</Text>
      </Screen>,
    );
    expect(screen.getByRole("header", { name: "Bugün" })).toBeTruthy();
    expect(screen.getByText("26 Kasım Perşembe")).toBeTruthy();
    expect(screen.getByText("sağ")).toBeTruthy();
  });
});
