"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Page, PageHeading } from "@/components/layout/page";
import { DeleteAccount } from "@/components/account/delete-account";
import { RequireMember } from "@/components/library/require-member";
import { useAuth } from "@/lib/auth";

export default function AccountPage() {
  const { user, signOut } = useAuth();
  return (
    <Page width="narrow">
      <RequireMember returnTo="/account">
        <PageHeading eyebrow="Account" title={user?.name ?? "Your account"} lede={user?.email} />
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Member since {user ? new Date(user.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long" }) : ""}.</p>
          <Button variant="outline" className="mt-6 rounded-full" onClick={() => void signOut()}>Sign out</Button>
        </div>
        <div className="mt-6 rounded-2xl border border-border p-6">
          <h2 className="display-serif text-2xl">Your data</h2>
          <p className="mt-2 text-sm text-muted-foreground">Everything you keep in Scriptune lives under this account. You can remove it all at any time, as described in the <Link href="/legal/privacy" className="underline underline-offset-4 hover:text-foreground">Privacy Policy</Link>.</p>
          <div className="mt-4">{user && <DeleteAccount email={user.email} />}</div>
        </div>
      </RequireMember>
    </Page>
  );
}
