// Small haptic wrappers. Fire-and-forget: failures (no hardware, web) are ignored.
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const enabled = Platform.OS === "ios" || Platform.OS === "android";

function fire(run: () => Promise<void>): void {
  if (!enabled) return;
  run().catch(() => {
    /* no haptics available */
  });
}

/** Light tap: stepper steps, toggles, small confirmations. */
export function tapLight(): void {
  fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** Selection changed: segmented control, chips. */
export function selection(): void {
  fire(() => Haptics.selectionAsync());
}

/** Something was saved or added. */
export function success(): void {
  fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

/** A destructive or failed action. */
export function warning(): void {
  fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
}
