"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";

/** Renders children for members; sends guests to sign in and back afterwards. */
export function RequireMember({ children, returnTo }: { children: ReactNode; returnTo: string }) {
  const { status } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (status === "guest") router.replace(`/auth/login?next=${encodeURIComponent(returnTo)}`);
  }, [status, router, returnTo]);
  if (status !== "member") {
    return <div className="space-y-3"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-40 w-full rounded-2xl" /></div>;
  }
  return <>{children}</>;
}
