// App icons: SF Symbols on iOS, Material Symbols on Android/web (expo-symbols).
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { View, type ColorValue, type StyleProp, type ViewStyle } from "react-native";

import { filledAndroidWeight } from "./iconFilledFont";
import { colors } from "./theme";

type SFName = Extract<SymbolViewProps["name"], string>;
type MaterialName = NonNullable<Exclude<SymbolViewProps["name"], string>["android"]>;

type IconSpec = {
  ios: SFName;
  /** SF Symbol used when `filled` is set (selected tab, active toggle). */
  iosFilled?: SFName;
  android: MaterialName;
};

/** Semantic icon names used by the app → platform symbol names. */
export const ICONS = {
  today: { ios: "circle.circle", iosFilled: "circle.circle.fill", android: "adjust" },
  catalog: { ios: "book", iosFilled: "book.fill", android: "menu_book" },
  history: { ios: "chart.bar", iosFilled: "chart.bar.fill", android: "bar_chart" },
  settings: { ios: "gearshape", iosFilled: "gearshape.fill", android: "settings" },
  add: { ios: "plus.circle", iosFilled: "plus.circle.fill", android: "add_circle" },
  plus: { ios: "plus", android: "add" },
  minus: { ios: "minus", android: "remove" },
  search: { ios: "magnifyingglass", android: "search" },
  close: { ios: "xmark", android: "close" },
  clear: { ios: "xmark.circle.fill", android: "cancel" },
  chevronLeft: { ios: "chevron.left", android: "chevron_left" },
  chevronRight: { ios: "chevron.right", android: "chevron_right" },
  check: { ios: "checkmark", android: "check" },
  water: { ios: "drop", iosFilled: "drop.fill", android: "water_drop" },
  heart: { ios: "heart", iosFilled: "heart.fill", android: "favorite" },
  heartFill: { ios: "heart.fill", iosFilled: "heart.fill", android: "favorite" },
  edit: { ios: "pencil", android: "edit" },
  trash: { ios: "trash", iosFilled: "trash.fill", android: "delete" },
  bell: { ios: "bell", iosFilled: "bell.fill", android: "notifications" },
  info: { ios: "info.circle", iosFilled: "info.circle.fill", android: "info" },
  calendar: { ios: "calendar", android: "calendar_today" },
  clock: { ios: "clock", iosFilled: "clock.fill", android: "schedule" },
} as const satisfies Record<string, IconSpec>;

export type IconName = keyof typeof ICONS;

/** Names whose Android glyph always uses the filled font. */
const ALWAYS_FILLED: ReadonlySet<IconName> = new Set<IconName>(["heartFill", "clear"]);

export type IconProps = {
  name: IconName;
  size?: number;
  color?: ColorValue;
  /** Filled variant (selected tab, active toggle). */
  filled?: boolean;
  /** When set the icon is announced as an image; otherwise it is decorative and hidden from screen readers. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function Icon({ name, size = 24, color = colors.text, filled = false, accessibilityLabel, style, testID }: IconProps) {
  const spec: IconSpec = ICONS[name];
  const fill = filled || ALWAYS_FILLED.has(name);
  const ios = fill ? (spec.iosFilled ?? spec.ios) : spec.ios;
  const labelled = !!accessibilityLabel;
  return (
    <View
      testID={testID}
      style={[{ width: size, height: size }, style]}
      accessible={labelled}
      accessibilityRole={labelled ? "image" : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={!labelled}
      importantForAccessibility={labelled ? "yes" : "no-hide-descendants"}
    >
      <SymbolView
        // The Android/web implementation loads its font once per mount; remount when the variant changes.
        key={fill ? "filled" : "outline"}
        name={{ ios, android: spec.android, web: spec.android }}
        weight={fill ? filledAndroidWeight : undefined}
        size={size}
        tintColor={color}
      />
    </View>
  );
}
