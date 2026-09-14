import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function confidenceLabel(confidence: number): string {
  if (confidence >= 80) return "Strong match";
  if (confidence >= 50) return "Likely";
  return "Possible";
}

/** Confidence as a gold-to-muted badge with the percentage. */
export function ConfidenceBadge({ confidence, className }: { confidence: number; className?: string }) {
  const strong = confidence >= 80;
  return (
    <Badge variant="outline" className={cn("gap-1.5 rounded-full border-transparent", strong ? "bg-gold/20 text-foreground" : "bg-secondary text-muted-foreground", className)}>
      <span className={cn("size-1.5 rounded-full", strong ? "bg-gold" : "bg-muted-foreground/60")} aria-hidden />
      {confidenceLabel(confidence)} · {confidence}%
    </Badge>
  );
}
