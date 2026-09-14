"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/api";
import { useAuthStore } from "@/lib/auth/store";

/** Permanent account deletion, behind a typed confirmation. */
export function DeleteAccount({ email }: { email: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const remove = useMutation({
    mutationFn: () => auth.deleteAccount(),
    onSuccess: async () => {
      await useAuthStore.getState().signOut({ remote: false });
      toast.success("Your account has been deleted");
      router.replace("/");
    },
    onError: () => toast.error("Could not delete the account. Try again."),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" className="rounded-full text-destructive" />}>Delete account</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="display-serif text-2xl">Delete your account?</DialogTitle>
          <DialogDescription>This removes your account, saved items, collections, notes and history for good. It cannot be undone. Type your email address to confirm.</DialogDescription>
        </DialogHeader>
        <Input value={typed} onChange={(event) => setTyped(event.target.value)} placeholder={email} autoComplete="off" aria-label="Type your email to confirm" />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" className="rounded-full" onClick={() => setOpen(false)}>Keep my account</Button>
          <Button variant="destructive" className="rounded-full" disabled={typed.trim().toLowerCase() !== email.toLowerCase() || remove.isPending} onClick={() => remove.mutate()}>Delete for good</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
