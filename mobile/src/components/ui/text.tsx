import { Text as NativeText, type TextProps } from "react-native";
import { fonts, useColors } from "@/theme";

type Variant = "display" | "title" | "body" | "muted" | "eyebrow";

const sizes: Record<Variant, number> = { display: 34, title: 22, body: 16, muted: 14, eyebrow: 11 };

/** The app's text styles. Display and title set in DM Serif Display; the rest in the system sans. */
export function Text({ variant = "body", style, ...props }: TextProps & { variant?: Variant }) {
  const colors = useColors();
  const serif = variant === "display" || variant === "title";
  return (
    <NativeText
      {...props}
      style={[
        {
          fontSize: sizes[variant],
          lineHeight: sizes[variant] * (serif ? 1.15 : 1.45),
          color: variant === "muted" ? colors.muted : variant === "eyebrow" ? colors.gold : colors.ink,
          fontFamily: serif ? fonts.serif : fonts.sans,
          letterSpacing: variant === "eyebrow" ? 2 : undefined,
          textTransform: variant === "eyebrow" ? "uppercase" : undefined,
          fontWeight: variant === "eyebrow" ? "600" : undefined,
        },
        style,
      ]}
    />
  );
}
