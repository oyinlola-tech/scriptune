import { Text as NativeText, type TextProps } from "react-native";
import { READING_SCALE, useSettings } from "@/lib/settings";
import { fonts, useColors } from "@/theme";

/**
 * The words themselves: a verse, a line of a hymn. Set in the serif and sized
 * by the reading-size setting, so someone holding the phone at arm's length in
 * a pew can make them larger without enlarging the whole interface.
 */
export function ReadingText({ size = 19, style, ...props }: TextProps & { size?: number }) {
  const colors = useColors();
  const scale = READING_SCALE[useSettings((state) => state.readingSize)];
  const fontSize = Math.round(size * scale);
  return <NativeText {...props} style={[{ fontFamily: fonts.serif, fontSize, lineHeight: Math.round(fontSize * 1.58), color: colors.ink }, style]} />;
}
