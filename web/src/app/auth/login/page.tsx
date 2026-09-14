import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { Page } from "@/components/layout/page";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <Page width="narrow">
      <div className="mb-8 text-center"><h1 className="display-serif text-4xl">Welcome back</h1><p className="mt-2 text-muted-foreground">Your library, your notes, your history.</p></div>
      <Suspense><AuthForm mode="login" /></Suspense>
    </Page>
  );
}
