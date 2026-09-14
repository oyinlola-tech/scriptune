"use client";

import { LogOut, Menu, Mic, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/brand/wordmark";
import { ButtonLink } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";
import { ThemeToggle } from "./theme-toggle";
import { NAV_LINKS } from "@/lib/site";
import { cn } from "@/lib/utils";

function NavLink({ href, label, onClick, className }: { href: string; label: string; onClick?: () => void; className?: string }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
        active && "bg-secondary text-foreground",
        className,
      )}
    >
      {label}
    </Link>
  );
}

function AccountMenu() {
  const { status, user, signOut } = useAuth();
  if (status === "loading") {
    return <div className="size-8 rounded-full bg-secondary" aria-hidden />;
  }
  if (status === "guest") {
    return (
      <div className="flex items-center gap-1">
        <ButtonLink href="/auth/register" variant="ghost" size="sm" className="hidden rounded-full px-3 md:inline-flex">
          Create account
        </ButtonLink>
        <ButtonLink href="/auth/login" variant="outline" size="sm" className="rounded-full px-4">
          Sign in
        </ButtonLink>
      </div>
    );
  }
  const initial = (user?.name ?? user?.email ?? "?").charAt(0).toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" aria-label="Account menu">
        {initial}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <div className="px-2 py-1.5 text-xs text-muted-foreground">{user?.email}</div>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/library" />}>My library</DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/library/history" />}>History</DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/account" />}><User data-icon="inline-start" /> Account</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void signOut()}><LogOut data-icon="inline-start" /> Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Sticky, blurred bar with the wordmark, three links and one account
 * action. Nothing competes with the microphone below it.
 */
export function SiteHeader() {
  const { isMember } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground">Skip to content</a>
      <div className="page-gutter mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4">
        <Wordmark />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => <NavLink key={link.href} {...link} />)}
          {isMember && <NavLink href="/library" label="Library" />}
        </nav>
        <div className="flex items-center gap-2">
          <ButtonLink href="/" size="sm" className="hidden rounded-full sm:inline-flex">
            <Mic data-icon="inline-start" /> Identify
          </ButtonLink>
          <ThemeToggle />
          <AccountMenu />
          <Sheet>
            <SheetTrigger className="inline-flex size-8 items-center justify-center rounded-full hover:bg-secondary md:hidden" aria-label="Open menu">
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="display-serif text-2xl">Menu</SheetTitle>
              <nav className="mt-6 flex flex-col gap-1" aria-label="Mobile">
                {NAV_LINKS.map((link) => <NavLink key={link.href} {...link} className="px-3 py-2 text-base" />)}
                {isMember && <NavLink href="/library" label="Library" className="px-3 py-2 text-base" />}
                <NavLink href="/hymnals" label="Hymnals" className="px-3 py-2 text-base" />
                <NavLink href="/bible" label="Bible" className="px-3 py-2 text-base" />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
