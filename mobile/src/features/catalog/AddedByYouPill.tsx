import { StyleSheet, Text } from "react-native";

import { useI18n } from "../../i18n";
import { colors, fonts } from "../../ui";

export function AddedByYouPill() {
  const { t } = useI18n();
  return <Text style={styles.pill}>{t("features.catalog.addedByYou")}</Text>;
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    backgroundColor: colors.track,
    color: colors.text,
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 8,
    borderRadius: 10,
    overflow: "hidden",
  },
});
