import { useState } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";

import { useI18n } from "../../i18n";
import { Button, colors, radius, spacing, TextField, typography } from "../../ui";

/** True when `input` is the confirmation word (case-insensitive in the current language). */
export function matchesConfirmWord(input: string, word: string, lang: "tr" | "en"): boolean {
  const locale = lang === "tr" ? "tr-TR" : "en-US";
  return input.trim().toLocaleUpperCase(locale) === word.toLocaleUpperCase(locale);
}

export function DeleteAllModal({
  visible,
  busy,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t, lang } = useI18n();
  const [text, setText] = useState("");
  const word = t("settings.deleteAllWord");
  const ok = matchesConfirmWord(text, word, lang);
  const close = () => {
    setText("");
    onCancel();
  };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <Text accessibilityRole="header" style={typography.heading}>
            {t("settings.deleteAllConfirmTitle")}
          </Text>
          <Text style={typography.body}>{t("settings.deleteAllConfirm", { word })}</Text>
          <TextField
            label={t("features.settings.deleteAllInputLabel")}
            value={text}
            onChangeText={setText}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <Button
            label={t("features.settings.deleteAllAction")}
            variant="danger"
            disabled={!ok}
            loading={busy}
            onPress={() => {
              setText("");
              onConfirm();
            }}
          />
          <Button label={t("common.cancel")} variant="ghost" onPress={close} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", padding: spacing.lg },
  dialog: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
});
