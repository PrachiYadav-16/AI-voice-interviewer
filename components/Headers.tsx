"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { logout } from "@/lib/auth";
import { useAuth } from "./AuthProvider";
import { ButtonLink } from "./ui";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 font-display text-xl font-bold tracking-tight", className)}>
      <svg viewBox="0 0 28 28" className="h-7 w-7" aria-hidden>
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
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const signOut = () => {
    logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {APP_NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={pathname.startsWith(n.href) ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-2 text-[0.95rem] font-bold text-muted hover:text-ink",
                pathname.startsWith(n.href) && "text-ink underline decoration-marigold decoration-[3px] underline-offset-[10px]",
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          {user && (
            <span className="flex items-center gap-2 text-sm text-muted">
              {/* eslint-disable-next-line @next/next/no-img-element -- avatars are user data URLs or SVGs */}
              {user.avatar && <img src={user.avatar} alt="" className="h-8 w-8 rounded-full border border-line bg-surface object-cover" />}
              {user.name}
            </span>
          )}
          <button onClick={signOut} className="flex items-center gap-1.5 rounded-md px-2 py-2 text-sm font-bold text-muted hover:text-ink">
            <LogOut className="h-4 w-4" aria-hidden /> Log out
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
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="block rounded-md px-2 py-3 font-bold">
              {n.label}
            </Link>
          ))}
          <button onClick={signOut} className="block w-full rounded-md px-2 py-3 text-left font-bold text-muted">
            Log out
          </button>
        </nav>
      )}
    </header>
  );
}

/** Header for public pages. */
export function SiteHeader() {
  const { user } = useAuth();
  return (
    <header className="border-b border-line bg-paper">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Site" className="flex items-center gap-1 sm:gap-2">
          <Link href="/#how" className="hidden rounded-md px-3 py-2 font-bold text-muted hover:text-ink sm:block">
            How it works
          </Link>
          <Link href="/#types" className="hidden rounded-md px-3 py-2 font-bold text-muted hover:text-ink lg:block">
            Interview types
          </Link>
          <Link href="/privacy" className="hidden rounded-md px-3 py-2 font-bold text-muted hover:text-ink lg:block">
            Privacy
          </Link>
          {user ? (
            <ButtonLink href="/dashboard" size="sm">
              Go to dashboard
            </ButtonLink>
          ) : (
            <>
              <Link href="/login" className="rounded-md px-3 py-2 font-bold text-ink hover:underline">
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
    <footer className="border-t border-line">
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
  return (
    <>
      <AppHeader />
      <main id="main" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </>
  );
}
