import Link from "next/link";
import { targetPath, type LibraryTargetDto } from "@/lib/api";

export function targetHref(target: LibraryTargetDto): string {
  return targetPath(target.type, target.key);
}

/** A resolved saved target: title and a line of its content. */
export function TargetLink({ target }: { target: LibraryTargetDto }) {
  const title = target.hymn?.title ?? target.verse?.reference ?? target.key;
  const line = target.hymn?.firstLine ?? target.verse?.text ?? "This item is no longer available.";
  return (
    <Link href={targetHref(target)} className="block hover:bg-secondary/60">
      <span className="display-serif block text-lg">{title}</span>
      <span className="line-clamp-1 block text-sm text-muted-foreground">{line}</span>
    </Link>
  );
}
