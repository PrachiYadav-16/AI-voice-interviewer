"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { applyPendingAvatar, consumeSignOut, currentUser, fromSupabaseUser, migrateLegacy, type PublicUser } from "@/lib/auth";
import { KEYS, read, subscribe, type UserProfile } from "@/lib/storage";
import { cloudEnabled, getSupabase } from "@/lib/supabase";
import { startCloudSync, type CloudSync, type SyncStatus } from "@/lib/cloud";

interface AuthState {
  /** undefined while we don't know yet (first paint, or loading the account's data). */
  user: PublicUser | null | undefined;
  /** Cloud mode only: the sync engine for the signed-in account. */
  sync: CloudSync | null;
  /** Cloud mode only: the account's data couldn't be loaded from the database. */
  loadError: string | null;
}

const AuthContext = createContext<AuthState>({ user: undefined, sync: null, loadError: null });

// ───────────── Device mode (no Supabase) ─────────────

const LOADING = "__loading__";
// A string snapshot keeps useSyncExternalStore referentially stable between reads.
const getSnapshot = () => JSON.stringify(currentUser());
const getServerSnapshot = () => LOADING;

function LocalAuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void migrateLegacy();
  }, []);
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const value = useMemo<AuthState>(
    () => ({ user: snap === LOADING ? undefined : (JSON.parse(snap) as PublicUser | null), sync: null, loadError: null }),
    [snap],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ───────────── Cloud mode (Supabase) ─────────────

function CloudAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [base, setBase] = useState<PublicUser | null | undefined>(undefined);
  const [sync, setSync] = useState<CloudSync | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    let cancelled = false;
    let currentId: string | null = null;

    const handle = async (u: User | null) => {
      if (cancelled) return;
      if (!u) {
        currentId = null;
        setSync(null);
        setBase(null);
        return;
      }
      if (u.id === currentId) {
        setBase(fromSupabaseUser(u)); // e.g. name changed
        return;
      }
      currentId = u.id;
      setBase(undefined);
      try {
        const s = await startCloudSync(sb, u.id);
        applyPendingAvatar(u.id);
        if (!cancelled) {
          setSync(s);
          setLoadError(null);
        }
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Couldn't load your data.");
      }
      if (!cancelled && currentId === u.id) setBase(fromSupabaseUser(u));
    };

    void sb.auth.getSession().then(({ data }) => handle(data.session?.user ?? null));
    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return;
      if (event === "PASSWORD_RECOVERY") router.push("/reset-password");
      // Supabase advises not calling its API synchronously inside this callback.
      setTimeout(() => void handle(session?.user ?? null), 0);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  // The avatar lives in the synced profile so it follows the account across devices.
  const profileKey = base ? KEYS.profile(base.id) : null;
  const avatar = useSyncExternalStore(
    subscribe,
    () => (profileKey ? (read<UserProfile>(profileKey, {}).avatar ?? null) : null),
    () => null,
  );

  const value = useMemo<AuthState>(
    () => ({ user: base ? { ...base, avatar: avatar ?? base.avatar } : base, sync, loadError }),
    [base, avatar, sync, loadError],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return cloudEnabled ? <CloudAuthProvider>{children}</CloudAuthProvider> : <LocalAuthProvider>{children}</LocalAuthProvider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

const IDLE: SyncStatus = { pending: 0, error: null };
const noop = () => () => {};

/** Live status of saving to the cloud (always idle in device mode). */
export function useSyncStatus(): SyncStatus {
  const { sync } = useAuth();
  return useSyncExternalStore(sync ? sync.subscribe : noop, sync ? sync.getStatus : () => IDLE, () => IDLE);
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
