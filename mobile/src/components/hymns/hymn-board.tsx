import { forwardRef } from "react";
import { TextInput, View, type TextInputProps } from "react-native";
import { Text } from "@/components/ui";
import { fonts, palette } from "@/theme";

/** "Sacred Songs and Solos" -> "SSS", the way a church hymn board abbreviates it. */
export function hymnalShortName(title: string): string {
  const words = title.split(/\s+/).filter((word) => /^[A-Z]/.test(word) && !/^(Hymnal|Hymns?|Book|Songbook|Edition)$/i.test(word));
  const initials = words.map((word) => word[0]).join("");
  return (initials || title.slice(0, 3)).toUpperCase().slice(0, 4);
}

/** The board is a real object at the front of the church: ink, gold and paper in both themes. */
const board = { slat: palette.light.ink, paper: palette.light.background, gold: palette.light.gold } as const;

/**
 * The hymn board: an ink slat with the book's short name in small caps and
 * the number in display serif, as it hangs at the front of a church.
 */
export function HymnBoard({ book, number, size = "md" }: { book: string; number: number | string; size?: "sm" | "md" }) {
  const numberSize = size === "sm" ? 22 : 28;
  return (
    <View accessibilityLabel={`${book} ${number}`} style={{ alignItems: "center", backgroundColor: board.slat, borderRadius: 6, paddingVertical: size === "sm" ? 4 : 6, paddingHorizontal: size === "sm" ? 8 : 10, minWidth: size === "sm" ? 48 : 60 }}>
      <Text style={{ color: board.paper, fontSize: 9, letterSpacing: 2, opacity: 0.7 }}>{hymnalShortName(book)}</Text>
      <Text style={{ color: board.paper, fontFamily: fonts.serif, fontSize: numberSize, lineHeight: numberSize + 4 }}>{number}</Text>
    </View>
  );
}

/**
 * A hymn board you can write on: the same slat, with the number as a field.
 * Typing a number and pressing Go opens that hymn.
 */
export const HymnBoardInput = forwardRef<TextInput, TextInputProps & { book: string; hint?: string }>(function HymnBoardInput({ book, hint, style, ...props }, ref) {
  return (
    <View style={{ backgroundColor: board.slat, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", paddingVertical: 10, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 16 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: board.paper, fontSize: 10, letterSpacing: 2.5, opacity: 0.7 }}>{hymnalShortName(book)}</Text>
        <TextInput
          ref={ref}
          keyboardType="number-pad"
          inputMode="numeric"
          returnKeyType="go"
          maxLength={4}
          placeholderTextColor={`${board.paper}66`}
          selectionColor={board.gold}
          accessibilityLabel={`Hymn number in ${book}`}
          {...props}
          style={[{ color: board.gold, fontFamily: fonts.serif, fontSize: 40, lineHeight: 46, padding: 0, margin: 0, includeFontPadding: false }, style]}
        />
      </View>
      {hint !== undefined && <Text style={{ color: board.paper, opacity: 0.55, fontSize: 12, maxWidth: 120, textAlign: "right" }}>{hint}</Text>}
    </View>
  );
});
