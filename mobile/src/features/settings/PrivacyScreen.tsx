import { Linking, Text } from "react-native";

import { useI18n } from "../../i18n";
import { Button, Card, Screen, SectionTitle, typography } from "../../ui";

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
    <Screen>
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
          label={t("features.settings.github")}
          variant="secondary"
          onPress={() => void Linking.openURL(t("features.settings.githubUrl")).catch(() => {})}
        />
      </Card>
    </Screen>
  );
}
