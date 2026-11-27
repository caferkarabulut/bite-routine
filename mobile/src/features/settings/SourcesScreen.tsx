import { router } from "expo-router";
import { Linking, Text } from "react-native";

import { useI18n } from "../../i18n";
import { Button, Card, IconButton, Screen, SectionTitle, typography } from "../../ui";

export function SourcesScreen() {
  const { t } = useI18n();
  const open = (url: string) => void Linking.openURL(url).catch(() => {});
  return (
    <Screen
      edges={["top", "bottom"]}
      largeTitle={t("sources.title")}
      centerHeader
      headerLeft={<IconButton icon="chevronLeft" accessibilityLabel={t("common.back")} onPress={() => router.back()} />}
    >
      <SectionTitle>{t("features.settings.sourcesUsdaTitle")}</SectionTitle>
      <Card>
        <Text style={typography.body}>{t("sources.usda")}</Text>
        <Button
          label={t("features.settings.sourcesUsdaLink")}
          variant="secondary"
          onPress={() => open(t("features.settings.sourcesUsdaUrl"))}
        />
      </Card>

      <SectionTitle>{t("features.settings.sourcesDishesTitle")}</SectionTitle>
      <Card>
        <Text style={typography.body}>{t("sources.recipes")}</Text>
        <Text style={typography.body}>{t("features.settings.sourcesDishesText")}</Text>
      </Card>

      <SectionTitle>{t("features.settings.sourcesOffTitle")}</SectionTitle>
      <Card>
        <Text style={typography.label}>{t("features.settings.sourcesOffAttribution")}</Text>
        <Text style={typography.body}>{t("sources.off")}</Text>
        <Button
          label={t("features.settings.sourcesOffLink")}
          variant="secondary"
          onPress={() => open(t("features.settings.sourcesOffUrl"))}
        />
        <Button
          label={t("features.settings.sourcesOffLicenseLink")}
          variant="secondary"
          onPress={() => open(t("features.settings.sourcesOffLicenseUrl"))}
        />
      </Card>

      <SectionTitle>{t("sources.fontTitle")}</SectionTitle>
      <Card>
        <Text style={typography.body}>{t("sources.font")}</Text>
      </Card>

      <SectionTitle>{t("features.settings.disclaimerTitle")}</SectionTitle>
      <Card>
        <Text style={typography.body}>{t("disclaimer")}</Text>
      </Card>
    </Screen>
  );
}
