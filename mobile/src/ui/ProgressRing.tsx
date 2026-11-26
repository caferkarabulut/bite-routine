// Circular progress (react-native-svg) with free content in the middle.
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { colors } from "./theme";

/** Clamps to 0..1; NaN and infinities become 0. */
export function clampProgress(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

export function ProgressRing({
  value,
  size = 140,
  strokeWidth = 12,
  color = colors.accent,
  trackColor = colors.track,
  accessibilityLabel,
  accessibilityValueText,
  children,
  testID,
}: {
  /** 0..1; clamped. */
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  accessibilityLabel?: string;
  /** Spoken value, e.g. "2.415 kcal left". Defaults to the percentage. */
  accessibilityValueText?: string;
  children?: ReactNode;
  testID?: string;
}) {
  const clamped = clampProgress(value);
  const r = (size - strokeWidth) / 2;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;
  const now = Math.round(clamped * 100);
  return (
    <View
      testID={testID}
      style={{ width: size, height: size }}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={accessibilityValueText ? { text: accessibilityValueText } : { min: 0, max: 100, now }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={c} cy={c} r={r} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        {clamped > 0 ? (
          <Circle
            testID={testID ? `${testID}-arc` : undefined}
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${circumference * clamped} ${circumference}`}
            transform={`rotate(-90 ${c} ${c})`}
          />
        ) : null}
      </Svg>
      {children ? <View style={styles.center}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
});
