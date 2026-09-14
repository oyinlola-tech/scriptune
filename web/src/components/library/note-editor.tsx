"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PenLine } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { library, type LibraryTargetType } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { keys } from "@/lib/query/keys";

/** A member's private note on this hymn or verse, edited in place. */
export function NoteEditor({ type, targetKey }: { type: LibraryTargetType; targetKey: string }) {
  const { isMember } = useAuth();
  const queryClient = useQueryClient();
  const notes = useQuery({ queryKey: keys.notes(), queryFn: () => library.notes(), enabled: isMember });
  const existing = notes.data?.notes.find((note) => note.target.type === type && note.target.key === targetKey) ?? null;
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState("");
  const startEditing = () => {
    setBody(existing?.body ?? "");
    setEditing(true);
  };

  const save = useMutation({
    mutationFn: () => library.putNote(type, targetKey, body.trim()),
    onSuccess: () => { setEditing(false); void queryClient.invalidateQueries({ queryKey: keys.notes() }); toast.success("Note saved"); },
    onError: () => toast.error("Could not save the note."),
  });
  const remove = useMutation({
    mutationFn: () => library.deleteNote(type, targetKey),
    onSuccess: () => { setEditing(false); setBody(""); void queryClient.invalidateQueries({ queryKey: keys.notes() }); toast.success("Note deleted"); },
    onError: () => toast.error("Could not delete the note."),
  });

  if (!isMember) return null;
  return (
    <section className="mt-12 rounded-2xl border border-border bg-card p-5" aria-labelledby="note-heading">
      <div className="flex items-center justify-between">
        <h2 id="note-heading" className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"><PenLine className="size-3.5" /> Your note</h2>
        {!editing && <Button variant="ghost" size="sm" className="rounded-full" onClick={startEditing}>{existing ? "Edit" : "Write a note"}</Button>}
      </div>
      {editing ? (
        <form onSubmit={(event) => { event.preventDefault(); if (body.trim() !== "") save.mutate(); }} className="mt-3 space-y-3">
          <Textarea value={body} onChange={(event) => setBody(event.target.value)} rows={4} placeholder="What this means to you, where you sang it, who to remember…" aria-label="Note" autoFocus className="bg-background" />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" className="rounded-full" disabled={body.trim() === "" || save.isPending}>Save note</Button>
            <Button type="button" size="sm" variant="ghost" className="rounded-full" onClick={() => setEditing(false)}>Cancel</Button>
            {existing && <Button type="button" size="sm" variant="ghost" className="ml-auto rounded-full text-destructive" onClick={() => remove.mutate()} disabled={remove.isPending}>Delete</Button>}
          </div>
        </form>
      ) : existing ? (
        <p className="mt-3 whitespace-pre-wrap text-sm">{existing.body}</p>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Only you can see notes. They stay with this {type === "hymn" ? "hymn" : "verse"} in your library.</p>
      )}
    </section>
  );
}
