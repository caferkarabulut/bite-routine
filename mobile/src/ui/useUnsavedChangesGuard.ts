import { usePreventRemove } from "expo-router";
import { useCallback, useState } from "react";
import { Alert } from "react-native";

import { useI18n } from "../i18n";

/**
 * Asks for confirmation before a screen with unsaved edits is removed from the stack
 * (Android back, iOS swipe back, header back arrow). The returned function turns the guard off
 * synchronously; call it right before navigating away after a successful save or delete.
 */
export function useUnsavedChangesGuard(isDirty: boolean): () => void {
  const { t } = useI18n();
  const [released, setReleased] = useState(false);
  const disablePrevention = usePreventRemove(isDirty && !released, ({ repeat }) => {
    Alert.alert(t("common.unsavedTitle"), t("common.unsavedMessage"), [
      { text: t("common.keepEditing"), style: "cancel" },
      {
        text: t("common.discard"),
        style: "destructive",
        onPress: () => {
          // repeat() turns the prevention off itself before it replays the blocked action.
          setReleased(true);
          repeat();
        },
      },
    ]);
  });
  return useCallback(() => {
    setReleased(true);
    disablePrevention();
  }, [disablePrevention]);
}
