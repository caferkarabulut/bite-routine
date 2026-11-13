import { Linking, Text } from "react-native";

import { useI18n } from "../../i18n";
import { Button, Card, Screen, SectionTitle, typography } from "../../ui";

export function SourcesScreen() {
  const { t } = useI18n();
  const open = (url: string) => void Linking.openURL(url).catch(() => {});
  return (
    <Screen>
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

      <SectionTitle>{t("features.settings.disclaimerTitle")}</SectionTitle>
      <Card>
        <Text style={typography.body}>{t("disclaimer")}</Text>
      </Card>
    </Screen>
  );
}
