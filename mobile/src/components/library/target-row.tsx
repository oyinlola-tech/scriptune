import { Link } from "expo-router";
import { Pressable } from "react-native";
import type { LibraryTargetDto } from "@scriptune/contracts";
import { Text } from "@/components/ui";
import { targetPath } from "@/lib/api";

/** One saved or collected item: what it is and where it leads. */
export function TargetRow({ target, subtitle }: { target: LibraryTargetDto; subtitle?: string | null }) {
  return (
    <Link href={targetPath(target.type, target.key) as never} asChild>
      <Pressable style={{ gap: 2, paddingVertical: 6 }}>
        <Text variant="eyebrow">{target.type === "hymn" ? "Hymn" : target.verse?.translation}</Text>
        <Text variant="title">{target.hymn?.title ?? target.verse?.reference}</Text>
        <Text variant="muted" numberOfLines={2}>{subtitle ?? target.hymn?.firstLine ?? target.verse?.text}</Text>
      </Pressable>
    </Link>
  );
}
