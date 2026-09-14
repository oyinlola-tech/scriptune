"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { toast } from "sonner";
import { Page, PageHeading } from "@/components/layout/page";
import { RequireMember } from "@/components/library/require-member";
import { TargetLink } from "@/components/library/target-link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { library } from "@/lib/api";
import { keys } from "@/lib/query/keys";

function CollectionDetail({ slug }: { slug: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const collection = useQuery({ queryKey: keys.collection(slug), queryFn: () => library.collection(slug) });
  const removeItem = useMutation({ mutationFn: (item: { type: "hymn" | "verse"; key: string }) => library.removeFromCollection(slug, item.type, item.key), onSuccess: () => { void queryClient.invalidateQueries({ queryKey: keys.collection(slug) }); void queryClient.invalidateQueries({ queryKey: keys.collections() }); } });
  const remove = useMutation({
    mutationFn: () => library.deleteCollection(slug),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: keys.collections() }); router.replace("/library"); },
    onError: () => toast.error("Could not delete the collection."),
  });
  if (collection.isPending) return <Skeleton className="h-40 rounded-2xl" />;
  if (collection.isError) return <p className="text-sm text-destructive">This collection could not be loaded.</p>;
  return (
    <>
      <PageHeading eyebrow="Collection" title={collection.data.name} lede={collection.data.description ?? undefined} actions={<Button variant="outline" className="rounded-full" onClick={() => { if (window.confirm("Delete this collection?")) remove.mutate(); }}><Trash2 data-icon="inline-start" /> Delete</Button>} />
      {collection.data.items.length === 0 ? <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">Empty so far. Add hymns and verses from their pages.</p> : (
        <ol className="divide-y divide-border/70 rounded-2xl border border-border bg-card">
          {collection.data.items.map((item) => (
            <li key={`${item.target.type}:${item.target.key}`} className="flex items-center gap-2 pr-2">
              <span className="w-10 shrink-0 pl-4 text-xs text-muted-foreground">{item.position}</span>
              <div className="min-w-0 flex-1 py-3"><TargetLink target={item.target} />{item.note && <p className="mt-1 text-xs text-muted-foreground">{item.note}</p>}</div>
              <Button variant="ghost" size="icon" aria-label="Remove from collection" onClick={() => removeItem.mutate({ type: item.target.type, key: item.target.key })}><Trash2 /></Button>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

export default function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return <Page><RequireMember returnTo={`/library/collections/${slug}`}><CollectionDetail slug={slug} /></RequireMember></Page>;
}
