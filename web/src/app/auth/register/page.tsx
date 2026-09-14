import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { Page } from "@/components/layout/page";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <Page width="narrow">
      <div className="mb-8 text-center"><h1 className="display-serif text-4xl">Keep what you find</h1><p className="mt-2 text-muted-foreground">Identifying is free without an account. An account lets you save hymns, verses and collections.</p></div>
      <Suspense><AuthForm mode="register" /></Suspense>
    </Page>
  );
}
