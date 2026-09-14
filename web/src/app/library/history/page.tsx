"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Page, PageHeading } from "@/components/layout/page";
import { RequireMember } from "@/components/library/require-member";
import { targetHref } from "@/components/library/target-link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { library } from "@/lib/api";
import { keys } from "@/lib/query/keys";

function History() {
  const queryClient = useQueryClient();
  const history = useQuery({ queryKey: keys.history(), queryFn: () => library.history(100) });
  const clear = useMutation({ mutationFn: () => library.clearHistory(), onSuccess: () => void queryClient.invalidateQueries({ queryKey: keys.history() }) });
  if (history.isPending) return <Skeleton className="h-40 rounded-2xl" />;
  if (history.isError) return <p className="text-sm text-destructive">Could not load your history.</p>;
  return (
    <>
      <PageHeading eyebrow="Library" title="History" lede="Everything you identified, searched for and read while signed in." actions={history.data.entries.length > 0 ? <Button variant="outline" className="rounded-full" onClick={() => { if (window.confirm("Clear your whole history?")) clear.mutate(); }}>Clear</Button> : undefined} />
      {history.data.entries.length === 0 ? <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">No history yet.</p> : (
        <ul className="divide-y divide-border/70 rounded-2xl border border-border bg-card">
          {history.data.entries.map((entry) => {
            const title = entry.target?.hymn?.title ?? entry.target?.verse?.reference ?? entry.query;
            const href = entry.target ? targetHref(entry.target) : entry.attemptId ? `/results/${entry.attemptId}` : `/search?q=${encodeURIComponent(entry.query)}`;
            return (
              <li key={entry.id}>
                <Link href={href} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-secondary/60">
                  <span><span className="display-serif block text-lg">{title}</span><span className="block text-xs text-muted-foreground">{entry.kind} · “{entry.query}”</span></span>
                  <time className="shrink-0 text-xs text-muted-foreground" dateTime={entry.occurredAt}>{new Date(entry.occurredAt).toLocaleDateString()}</time>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export default function HistoryPage() {
  return <Page><RequireMember returnTo="/library/history"><History /></RequireMember></Page>;
}
