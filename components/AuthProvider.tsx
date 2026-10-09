"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { consumeSignOut, currentUser, migrateLegacy, type PublicUser } from "@/lib/auth";
import { subscribe } from "@/lib/storage";

interface AuthState {
  /** undefined while we haven't read browser storage yet (server render / first paint). */
  user: PublicUser | null | undefined;
}

const AuthContext = createContext<AuthState>({ user: undefined });

const LOADING = "__loading__";
// A string snapshot keeps useSyncExternalStore referentially stable between reads.
const getSnapshot = () => JSON.stringify(currentUser());
const getServerSnapshot = () => LOADING;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void migrateLegacy();
  }, []);
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const value = useMemo<AuthState>(
    () => ({ user: snap === LOADING ? undefined : (JSON.parse(snap) as PublicUser | null) }),
    [snap],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

/** Client-side route protection: redirects to /login when no profile is signed in. */
export function RequireAuth({ children }: { children: (user: PublicUser) => React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const target = useRef<string | null>(null);

  useEffect(() => {
    if (user !== null) {
      target.current = null;
      return;
    }
    // Decide once: after an explicit sign-out go home, otherwise ask to log in and come back.
    target.current ??= consumeSignOut() ? "/" : `/login?next=${encodeURIComponent(pathname)}`;
    router.replace(target.current);
  }, [user, router, pathname]);

  if (!user) {
    return (
      <div className="grid min-h-[60dvh] place-items-center text-muted" role="status">
        Loading…
      </div>
    );
  }
  return <>{children(user)}</>;
}
