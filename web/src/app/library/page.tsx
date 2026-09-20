"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Page, PageHeading } from "@/components/layout/page";
import { RequireMember } from "@/components/library/require-member";
import { TargetLink } from "@/components/library/target-link";
import { Button, ButtonLink } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { library } from "@/lib/api";
import { keys } from "@/lib/query/keys";

function Saved() {
  const queryClient = useQueryClient();
  const saved = useQuery({ queryKey: keys.saved(), queryFn: () => library.saved() });
  const remove = useMutation({ mutationFn: (item: { type: "hymn" | "verse"; key: string }) => library.unsave(item.type, item.key), onSuccess: () => void queryClient.invalidateQueries({ queryKey: keys.saved() }) });
  if (saved.isPending) return <Skeleton className="h-40 rounded-2xl" />;
  if (saved.isError) return <p className="text-sm text-destructive">Could not load your saved items.</p>;
  if (saved.data.items.length === 0) return <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">Nothing saved yet. Press Save on any hymn or verse.</p>;
  return (
    <ul className="divide-y divide-border/70 rounded-2xl border border-border bg-card">
      {saved.data.items.map((item) => (
        <li key={`${item.target.type}:${item.target.key}`} className="flex items-center gap-2 pr-2">
          <div className="min-w-0 flex-1 px-4 py-3"><TargetLink target={item.target} /></div>
          <Button variant="ghost" size="icon" aria-label="Remove" onClick={() => remove.mutate({ type: item.target.type, key: item.target.key })}><Trash2 /></Button>
        </li>
      ))}
    </ul>
  );
}

function Collections() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const collections = useQuery({ queryKey: keys.collections(), queryFn: () => library.collections() });
  const create = useMutation({
    mutationFn: () => library.createCollection(name.trim()),
    onSuccess: () => { setName(""); setOpen(false); void queryClient.invalidateQueries({ queryKey: keys.collections() }); },
    onError: () => toast.error("Could not create the collection."),
  });
  return (
    <div className="space-y-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button variant="outline" className="rounded-full" />}><Plus data-icon="inline-start" /> New collection</DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle className="display-serif text-2xl">New collection</DialogTitle><DialogDescription>A set of hymns and verses, like a Sunday order of service.</DialogDescription></DialogHeader>
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" aria-label="Collection name" autoFocus />
          <DialogFooter><Button className="rounded-full" disabled={name.trim() === "" || create.isPending} onClick={() => create.mutate()}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      {collections.isPending ? <Skeleton className="h-32 rounded-2xl" /> : collections.isError ? <p className="text-sm text-destructive">Could not load collections.</p> : collections.data.collections.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">No collections yet.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {collections.data.collections.map((collection) => (
            <li key={collection.slug}>
              <Link href={`/library/collections/${collection.slug}`} className="block rounded-2xl border border-border bg-card p-5 hover:bg-secondary/60">
                <span className="display-serif block text-xl">{collection.name}</span>
                <span className="text-sm text-muted-foreground">{collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Notes() {
  const notes = useQuery({ queryKey: keys.notes(), queryFn: () => library.notes() });
  if (notes.isPending) return <Skeleton className="h-32 rounded-2xl" />;
  if (notes.isError) return <p className="text-sm text-destructive">Could not load notes.</p>;
  if (notes.data.notes.length === 0) return <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">No notes yet. Notes live on hymn and verse pages.</p>;
  return (
    <ul className="space-y-3">
      {notes.data.notes.map((note) => (
        <li key={`${note.target.type}:${note.target.key}`} className="rounded-2xl border border-border bg-card p-4">
          <TargetLink target={note.target} />
          <p className="mt-2 whitespace-pre-wrap text-sm">{note.body}</p>
        </li>
      ))}
    </ul>
  );
}

export default function LibraryPage() {
  return (
    <Page>
      <RequireMember returnTo="/library">
        <PageHeading eyebrow="Library" title="What you keep" actions={<ButtonLink variant="outline" className="rounded-full" href="/library/history">History</ButtonLink>} />
        <Tabs defaultValue="saved">
          <TabsList className="mb-6 rounded-full"><TabsTrigger value="saved">Saved</TabsTrigger><TabsTrigger value="collections">Collections</TabsTrigger><TabsTrigger value="notes">Notes</TabsTrigger></TabsList>
          <TabsContent value="saved"><Saved /></TabsContent>
          <TabsContent value="collections"><Collections /></TabsContent>
          <TabsContent value="notes"><Notes /></TabsContent>
        </Tabs>
      </RequireMember>
    </Page>
  );
}
