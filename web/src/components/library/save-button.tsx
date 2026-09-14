"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, ButtonLink } from "@/components/ui/button";
import { library, type LibraryTargetType } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { keys } from "@/lib/query/keys";

/**
 * Save to the library. Guests are invited to sign in only when they press
 * it, never before.
 */
export function SaveButton({ type, targetKey, size = "sm" }: { type: LibraryTargetType; targetKey: string; size?: "sm" | "default" }) {
  const { isMember } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const saved = useQuery({ queryKey: keys.saved(), queryFn: () => library.saved(), enabled: isMember, select: (data) => new Set(data.items.map((item) => `${item.target.type}:${item.target.key}`)) });
  const isSaved = saved.data?.has(`${type}:${targetKey}`) ?? false;

  const toggle = useMutation({
    mutationFn: async () => {
      if (isSaved) await library.unsave(type, targetKey);
      else await library.save(type, targetKey);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.saved() });
      toast.success(isSaved ? "Removed from your library" : "Saved to your library");
    },
    onError: () => toast.error("Could not update your library. Please try again."),
  });

  if (!isMember) {
    return (
      <Button
        variant="outline"
        size={size}
        className="rounded-full"
        onClick={() => toast("Create an account to save this", { action: { label: "Sign in", onClick: () => router.push("/auth/login") } })}
      >
        <Bookmark data-icon="inline-start" /> Save
      </Button>
    );
  }
  return (
    <Button variant={isSaved ? "secondary" : "outline"} size={size} className="rounded-full" onClick={() => toggle.mutate()} disabled={toggle.isPending} aria-pressed={isSaved}>
      {isSaved ? <BookmarkCheck data-icon="inline-start" className="text-gold" /> : <Bookmark data-icon="inline-start" />}
      {isSaved ? "Saved" : "Save"}
    </Button>
  );
}

export function SignInPrompt({ text = "Sign in to keep hymns and verses in your library." }: { text?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-8 text-center">
      <p className="display-serif text-2xl">{text}</p>
      <div className="mt-4 flex justify-center gap-2">
        <ButtonLink href="/auth/login" className="rounded-full">Sign in</ButtonLink>
        <ButtonLink href="/auth/register" variant="outline" className="rounded-full">Create account</ButtonLink>
      </div>
    </div>
  );
}
