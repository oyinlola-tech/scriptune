"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_URL, ApiError, auth, library, type AuthSessionDto } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toHistoryInput, useGuestHistory } from "@/lib/history/guest-history";

const schema = z.object({
  name: z.string().trim().max(80).optional(),
  email: z.string().trim().email("Enter a valid email address").max(254),
  password: z.string().min(8, "Use at least 8 characters").max(128, "Use at most 128 characters"),
});
type Values = z.infer<typeof schema>;

function safeNext(value: string | null): string {
  if (value === null || /[\\]/.test(value) || !value.startsWith("/") || value.startsWith("//")) return "/library";
  try {
    const url = new URL(value, window.location.origin);
    return url.origin === window.location.origin ? url.pathname + url.search + url.hash : "/library";
  } catch {
    return "/library";
  }
}

/** Shared sign-in / create-account form with Google alongside. */
export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const { signIn } = useAuth();
  const guestEntries = useGuestHistory((state) => state.entries);
  const clearGuest = useGuestHistory((state) => state.clear);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: "", email: "", password: "" } });

  const submit = useMutation({
    mutationFn: (values: Values) => (mode === "login" ? auth.login(values.email, values.password) : auth.register(values.email, values.password, values.name || undefined)),
    onSuccess: async (session: AuthSessionDto) => {
      signIn(session);
      if (guestEntries.length > 0) {
        try {
          await library.importHistory(guestEntries.map(toHistoryInput));
          clearGuest();
          toast.success("Your recent history is now in your account");
        } catch {
          // History import is best effort; the account works without it.
        }
      }
      router.replace(next);
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) form.setError("email", { message: "An account with this email already exists." });
      else if (error instanceof ApiError && error.status === 401) form.setError("password", { message: "Wrong email or password." });
      else if (error instanceof ApiError && error.status === 423) toast.error("Too many failed attempts. Try again in a few minutes.");
      else toast.error("Something went wrong. Please try again.");
    },
  });

  return (
    <div className="mx-auto w-full max-w-sm">
      <a href={`${API_URL}/auth/google?redirect=${encodeURIComponent(next)}`} className="flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-card text-sm font-medium hover:bg-secondary">
        <GoogleMark /> Continue with Google
      </a>
      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
      <form onSubmit={form.handleSubmit((values) => submit.mutate(values))} className="space-y-4" noValidate>
        {mode === "register" && (
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" autoComplete="name" className="h-11 rounded-xl bg-card" {...form.register("name")} />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" className="h-11 rounded-xl bg-card" aria-invalid={form.formState.errors.email !== undefined} {...form.register("email")} />
          {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} className="h-11 rounded-xl bg-card" aria-invalid={form.formState.errors.password !== undefined} {...form.register("password")} />
          {form.formState.errors.password && <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>}
        </div>
        <Button type="submit" className="h-11 w-full rounded-full" disabled={submit.isPending}>{mode === "login" ? "Sign in" : "Create account"}</Button>
        {mode === "register" && (
          <p className="text-center text-xs text-muted-foreground">
            By creating an account you agree to the <Link href="/legal/terms" className="underline underline-offset-4 hover:text-foreground">Terms</Link> and <Link href="/legal/privacy" className="underline underline-offset-4 hover:text-foreground">Privacy Policy</Link>.
          </p>
        )}
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {mode === "login" ? <>New here? <Link href={`/auth/register?next=${encodeURIComponent(next)}`} className="text-foreground underline-offset-4 hover:underline">Create an account</Link></> : <>Already have an account? <Link href={`/auth/login?next=${encodeURIComponent(next)}`} className="text-foreground underline-offset-4 hover:underline">Sign in</Link></>}
      </p>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.1 2.7-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1C3.3 21.3 7.3 24 12 24z" />
      <path fill="#FBBC05" d="M5.3 14.3c-.5-1.5-.5-3.1 0-4.6V6.6H1.3c-1.7 3.4-1.7 7.4 0 10.8l4-3.1z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.3 0 3.3 2.7 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
    </svg>
  );
}
