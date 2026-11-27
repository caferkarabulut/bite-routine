import { router } from "expo-router";
import { Linking, Text } from "react-native";

import { useI18n } from "../../i18n";
import { Button, Card, IconButton, Screen, SectionTitle, typography } from "../../ui";

const POINTS = [
  "privacyNoAccount",
  "privacyNoServer",
  "privacyNoTracking",
  "privacyLocal",
  "privacyBackup",
  "privacyDelete",
] as const;

export function PrivacyScreen() {
  const { t } = useI18n();
  return (
    <Screen
      edges={["top", "bottom"]}
      largeTitle={t("settings.privacy")}
      centerHeader
      headerLeft={<IconButton icon="chevronLeft" accessibilityLabel={t("common.back")} onPress={() => router.back()} />}
    >
      <SectionTitle>{t("features.settings.privacyHeadline")}</SectionTitle>
      <Card>
        {POINTS.map((key) => (
          <Text key={key} style={typography.body}>
            {t(`features.settings.${key}`)}
          </Text>
        ))}
      </Card>
      <Card>
        <Text style={typography.body}>{t("features.settings.privacyContact")}</Text>
        <Button
          label={t("features.settings.privacyPolicyLink")}
          variant="secondary"
          onPress={() => void Linking.openURL(t("features.settings.privacyPolicyUrl")).catch(() => {})}
        />
      </Card>
    </Screen>
  );
}
