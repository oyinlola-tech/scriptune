"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderPlus, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { library, type LibraryTargetType } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { keys } from "@/lib/query/keys";

/** Adds a hymn or verse to one of the member's collections, creating one inline if needed. */
export function AddToCollectionButton({ type, targetKey }: { type: LibraryTargetType; targetKey: string }) {
  const { isMember } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const collections = useQuery({ queryKey: keys.collections(), queryFn: () => library.collections(), enabled: isMember && open });

  const add = useMutation({
    mutationFn: (slug: string) => library.addToCollection(slug, type, targetKey),
    onSuccess: (_item, slug) => {
      void queryClient.invalidateQueries({ queryKey: keys.collections() });
      void queryClient.invalidateQueries({ queryKey: keys.collection(slug) });
      setOpen(false);
      toast.success("Added to the collection");
    },
    onError: () => toast.error("Could not add to the collection."),
  });
  const createAndAdd = useMutation({
    mutationFn: async () => {
      const collection = await library.createCollection(name.trim());
      await library.addToCollection(collection.slug, type, targetKey);
      return collection;
    },
    onSuccess: () => {
      setName("");
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: keys.collections() });
      toast.success("Collection created and item added");
    },
    onError: () => toast.error("Could not create the collection."),
  });

  if (!isMember) return null;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="rounded-full" />}><FolderPlus data-icon="inline-start" /> Add to collection</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="display-serif text-2xl">Add to a collection</DialogTitle>
          <DialogDescription>Collections group hymns and verses, like a Sunday order of service.</DialogDescription>
        </DialogHeader>
        <ul className="max-h-64 divide-y divide-border/70 overflow-auto rounded-xl border border-border">
          {collections.data?.collections.map((collection) => (
            <li key={collection.slug}>
              <button type="button" onClick={() => add.mutate(collection.slug)} disabled={add.isPending} className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-secondary/60">
                <span className="display-serif text-lg">{collection.name}</span>
                <span className="text-xs text-muted-foreground">{collection.itemCount}</span>
              </button>
            </li>
          ))}
          {collections.data?.collections.length === 0 && <li className="px-4 py-3 text-sm text-muted-foreground">No collections yet. Create one below.</li>}
        </ul>
        <form onSubmit={(event) => { event.preventDefault(); if (name.trim() !== "") createAndAdd.mutate(); }} className="flex gap-2">
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="New collection name" aria-label="New collection name" />
          <Button type="submit" className="rounded-full" disabled={name.trim() === "" || createAndAdd.isPending}><Plus data-icon="inline-start" /> Create</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
