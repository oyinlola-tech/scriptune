import { isLegalSlug, LEGAL_DOCUMENTS, LEGAL_SLUGS } from "@scriptune/contracts";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import { Pressable, View } from "react-native";
import { Screen, Text } from "@/components/ui";
import { radius, spacing, useColors } from "@/theme";

/** Terms, privacy and licences from the shared legal text. Reachable before onboarding. */
export default function LegalScreen() {
  const colors = useColors();
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const slug = isLegalSlug(doc) ? doc : "terms";
  const document = LEGAL_DOCUMENTS[slug];
  return (
    <Screen>
      <Stack.Screen options={{ title: document.title }} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
        {LEGAL_SLUGS.map((other) => (
          <Link key={other} href={{ pathname: "/legal/[doc]", params: { doc: other } }} asChild replace>
            <Pressable style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: radius.pill, borderWidth: 1, borderColor: other === slug ? colors.ink : colors.border, backgroundColor: other === slug ? colors.ink : "transparent" }}>
              <Text style={{ fontSize: 13, color: other === slug ? colors.background : colors.muted }}>{LEGAL_DOCUMENTS[other].title}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
      <Text variant="eyebrow">Legal</Text>
      <Text variant="display">{document.title}</Text>
      <Text variant="muted">{document.summary}</Text>
      <Text variant="muted" style={{ fontSize: 12 }}>Last updated {new Date(document.updatedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</Text>
      {document.sections.map((section) => (
        <View key={section.heading} style={{ gap: spacing.sm, marginTop: spacing.sm }}>
          <Text variant="title">{section.heading}</Text>
          {section.paragraphs.map((paragraph, index) => <Text key={index}>{paragraph}</Text>)}
          {section.bullets?.map((bullet, index) => (
            <View key={index} style={{ flexDirection: "row", gap: spacing.sm, paddingLeft: spacing.sm }}>
              <Text style={{ color: colors.gold }}>•</Text>
              <Text style={{ flex: 1 }}>{bullet}</Text>
            </View>
          ))}
        </View>
      ))}
    </Screen>
  );
}
