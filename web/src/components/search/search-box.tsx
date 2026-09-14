"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";

/** Submits to the search page. */
export function SearchBox({ initial = "", autoFocus = false, size = "lg" }: { initial?: string; autoFocus?: boolean; size?: "md" | "lg" }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = value.trim();
    if (text.length >= 2) router.push(`/search?q=${encodeURIComponent(text)}`);
  };
  return (
    <form onSubmit={submit} role="search" className="relative w-full">
      <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        autoFocus={autoFocus}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Words from a hymn or a verse…"
        aria-label="Search hymns and verses"
        className={size === "lg" ? "h-13 rounded-full bg-card pl-11 pr-5 text-base" : "h-10 rounded-full bg-card pl-10 pr-4"}
      />
    </form>
  );
}
