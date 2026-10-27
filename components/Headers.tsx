"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CloudAlert, LogOut, Menu, X } from "lucide-react";
import { logout } from "@/lib/auth";
import { useAuth, useSyncStatus } from "./AuthProvider";
import { Avatar, ButtonLink, Notice } from "./ui";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5 font-display text-xl font-extrabold tracking-tight", className)}>
      <svg viewBox="0 0 28 28" className="h-8 w-8" aria-hidden>
        <rect width="28" height="28" rx="8" fill="var(--color-indigo)" />
        <path d="M9 8v12M14 11v6M19 8v12" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="23.5" cy="4.5" r="3" fill="var(--color-marigold)" />
      </svg>
      IntervU
    </Link>
  );
}

const APP_NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/practice", label: "New interview" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Settings" },
];

/** Header for signed-in pages. */
export function AppHeader() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // RequireAuth sends the page home once the profile is cleared.
  const signOut = () => void logout();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 rounded-[10px] border border-line bg-paper/80 p-1 md:flex">
          {APP_NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={pathname.startsWith(n.href) ? "page" : undefined}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink",
                pathname.startsWith(n.href) && "bg-surface text-ink shadow-[var(--shadow-card)]",
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          {user && (
            <Link href="/settings" className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-3 text-sm font-semibold hover:bg-paper">
              <Avatar src={user.avatar} name={user.name} className="h-8 w-8" />
              <span className="max-w-[10rem] truncate">{user.name}</span>
            </Link>
          )}
          <SyncBadge />
          <button
            onClick={signOut}
            className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-paper hover:text-ink"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <button
          className="rounded-md p-2 md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Main" className="border-t border-line bg-surface px-4 py-3 md:hidden">
          {APP_NAV.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-3 font-semibold hover:bg-paper">
              {n.label}
            </Link>
          ))}
          <button onClick={signOut} className="block w-full rounded-lg px-3 py-3 text-left font-semibold text-muted hover:bg-paper">
            Log out
          </button>
        </nav>
      )}
    </header>
  );
}

/** Appears only when changes couldn't be saved to the account yet. */
function SyncBadge() {
  const { error } = useSyncStatus();
  if (!error) return null;
  return (
    <span role="status" title={error} className="flex items-center gap-1.5 rounded-md bg-marigold-soft px-2 py-1 text-xs font-semibold text-[#7a4f00]">
      <CloudAlert className="h-4 w-4" aria-hidden /> Not saved yet
    </span>
  );
}

/** Header for public pages. */
export function SiteHeader() {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Site" className="flex items-center gap-1 sm:gap-2">
          <Link href="/#how" className="hidden rounded-md px-3 py-2 text-sm font-semibold text-muted hover:text-ink sm:block">
            How it works
          </Link>
          <Link href="/#types" className="hidden rounded-md px-3 py-2 text-sm font-semibold text-muted hover:text-ink lg:block">
            Interview types
          </Link>
          <Link href="/privacy" className="hidden rounded-md px-3 py-2 text-sm font-semibold text-muted hover:text-ink lg:block">
            Privacy
          </Link>
          {user ? (
            <ButtonLink href="/dashboard" size="sm">
              Go to dashboard
            </ButtonLink>
          ) : (
            <>
              <Link href="/login" className="rounded-md px-3 py-2 text-sm font-semibold text-ink hover:bg-surface">
                Log in
              </Link>
              <ButtonLink href="/signup" size="sm">
                Sign up
              </ButtonLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>IntervU is a practice tool. Scores and feedback are AI-generated and don&apos;t predict selection.</p>
        <nav aria-label="Footer" className="flex gap-4">
          <Link href="/privacy" className="hover:text-ink">
            Privacy
          </Link>
          <Link href="/#faq" className="hover:text-ink">
            FAQ
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { loadError } = useAuth();
  return (
    <>
      <AppHeader />
      <main id="main" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {loadError && (
          <Notice tone="warning" title="Couldn't load your saved interviews" className="mb-6" role="alert">
            {loadError} You can keep practising; new interviews are kept on this device and saved to your account once the connection works. Reload the
            page to try again.
          </Notice>
        )}
        {children}
      </main>
    </>
  );
}
