"use client";

import type { User } from "@supabase/supabase-js";
import { KEYS, clearLocalCache, deleteAllUserData, newId, read, remove, updateProfile, write, type StoredUser } from "./storage";
import { cloudEnabled, getSupabase } from "./supabase";
import { activeSync, stopCloudSync } from "./cloud";

/**
 * Two account modes:
 * - Cloud (Supabase configured): real accounts with email confirmation and email
 *   password reset. Interviews sync to the database (see lib/cloud.ts).
 * - Device (no Supabase): accounts live in this browser. Passwords are never stored,
 *   only a salted PBKDF2-SHA-256 hash.
 */

export { cloudEnabled };

const ITERATIONS = 210_000;

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: number;
}

export type AuthResult =
  | { ok: true; user: PublicUser }
  | { ok: false; error: string }
  /** Cloud signup where Supabase requires the email to be confirmed first. */
  | { ok: "confirm"; email: string };

const PENDING_AVATAR = "intervu.pendingAvatar";
const SHORT_AVATAR = 600;

export function fromSupabaseUser(u: User): PublicUser {
  const meta = (u.user_metadata ?? {}) as { name?: string; avatar?: string };
  return {
    id: u.id,
    email: u.email ?? "",
    name: meta.name?.trim() || (u.email ?? "You").split("@")[0],
    avatar: meta.avatar,
    createdAt: Date.parse(u.created_at) || Date.now(),
  };
}

/** Uploaded avatars are too large for auth metadata; they're applied to the profile after first sign-in. */
export function applyPendingAvatar(userId: string): void {
  const pending = read<string | null>(PENDING_AVATAR, null);
  if (!pending) return;
  updateProfile(userId, { avatar: pending });
  remove(PENDING_AVATAR);
}

function friendlyAuthError(message: string | undefined): string {
  const m = (message ?? "").toLowerCase();
  if (m.includes("invalid login")) return "That email and password don't match an account.";
  if (m.includes("email not confirmed")) return "Confirm your email first. Check your inbox for the link we sent, then log in.";
  if (m.includes("already registered") || m.includes("already been registered")) return "An account with this email already exists. Log in instead.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Wait a minute and try again.";
  if (m.includes("password") && m.includes("least")) return "Use a stronger password (at least 8 characters).";
  if (m.includes("fetch") || m.includes("network")) return "Couldn't reach the server. Check your internet connection and try again.";
  return "Something went wrong. Try again in a moment.";
}

const origin = () => (typeof window === "undefined" ? "" : window.location.origin);

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export async function hashPassword(password: string, saltHex?: string): Promise<{ hash: string; salt: string }> {
  const salt = saltHex ? fromHex(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS }, key, 256);
  return { hash: toHex(bits), salt: toHex(salt.buffer) };
}

/** Constant-time comparison of two hex strings. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const toPublic = ({ id, name, email, avatar, createdAt }: StoredUser): PublicUser => ({ id, name, email, avatar, createdAt });

const normaliseEmail = (email: string) => email.trim().toLowerCase();

export function validateSignup(input: { name: string; email: string; password: string; confirm: string }): string | null {
  if (input.name.trim().length < 2) return "Enter your name (at least 2 characters).";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) return "Enter a valid email address.";
  if (input.password.length < 8) return "Use a password of at least 8 characters.";
  if (input.password !== input.confirm) return "The two passwords don't match.";
  return null;
}

export async function signup(input: { name: string; email: string; password: string; avatar?: string }): Promise<AuthResult> {
  const sb = getSupabase();
  if (sb) {
    const shortAvatar = input.avatar && input.avatar.length <= SHORT_AVATAR ? input.avatar : undefined;
    if (input.avatar && !shortAvatar) write(PENDING_AVATAR, input.avatar);
    const { data, error } = await sb.auth.signUp({
      email: normaliseEmail(input.email),
      password: input.password,
      options: { data: { name: input.name.trim(), avatar: shortAvatar }, emailRedirectTo: `${origin()}/dashboard` },
    });
    if (error) return { ok: false, error: friendlyAuthError(error.message) };
    // Supabase hides existing accounts by returning a user with no identities.
    if (data.user && data.user.identities?.length === 0) {
      return { ok: false, error: "An account with this email already exists. Log in instead." };
    }
    if (!data.session) return { ok: "confirm", email: normaliseEmail(input.email) };
    return { ok: true, user: fromSupabaseUser(data.user!) };
  }

  await migrateLegacy();
  const users = read<StoredUser[]>(KEYS.users, []);
  const email = normaliseEmail(input.email);
  if (users.some((u) => u.email === email)) {
    return { ok: false, error: "An account with this email already exists on this device. Log in instead." };
  }
  const { hash, salt } = await hashPassword(input.password);
  const user: StoredUser = {
    id: newId(),
    name: input.name.trim(),
    email,
    avatar: input.avatar,
    createdAt: Date.now(),
    passwordHash: hash,
    salt,
  };
  write(KEYS.users, [...users, user]);
  write(KEYS.current, { userId: user.id });
  return { ok: true, user: toPublic(user) };
}

export async function login(emailInput: string, password: string): Promise<AuthResult> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.auth.signInWithPassword({ email: normaliseEmail(emailInput), password });
    if (error || !data.user) return { ok: false, error: friendlyAuthError(error?.message) };
    return { ok: true, user: fromSupabaseUser(data.user) };
  }

  await migrateLegacy();
  const users = read<StoredUser[]>(KEYS.users, []);
  const user = users.find((u) => u.email === normaliseEmail(emailInput));
  // Hash even when the user doesn't exist so timing doesn't reveal which emails are registered.
  const { hash } = await hashPassword(password, user?.salt ?? "00".repeat(16));
  if (!user || !safeEqual(hash, user.passwordHash)) {
    return { ok: false, error: "That email and password don't match an account on this device." };
  }
  write(KEYS.current, { userId: user.id });
  return { ok: true, user: toPublic(user) };
}

/**
 * There's no server or email, so recovery checks the account's email and name.
 * Device accounts only separate profiles on a shared browser (anyone with access to
 * the browser can already read local storage), so this keeps history without
 * weakening real security.
 */
export async function resetPassword(input: { email: string; name: string; password: string; confirm: string }): Promise<AuthResult> {
  await migrateLegacy();
  if (input.password.length < 8) return { ok: false, error: "Use a password of at least 8 characters." };
  if (input.password !== input.confirm) return { ok: false, error: "The two passwords don't match." };
  const users = read<StoredUser[]>(KEYS.users, []);
  const norm = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();
  const user = users.find((u) => u.email === normaliseEmail(input.email) && norm(u.name) === norm(input.name));
  if (!user) {
    return { ok: false, error: "No account on this device matches that email and name. Check the spelling of the name you signed up with." };
  }
  const { hash, salt } = await hashPassword(input.password);
  write(
    KEYS.users,
    users.map((u) => (u.id === user.id ? { ...u, passwordHash: hash, salt } : u)),
  );
  write(KEYS.current, { userId: user.id });
  return { ok: true, user: toPublic(user) };
}

/** Cloud mode: emails a password reset link that opens /reset-password. */
export async function requestPasswordReset(email: string): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Password reset by email isn't available on this site." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return { ok: false, error: "Enter a valid email address." };
  const { error } = await sb.auth.resetPasswordForEmail(normaliseEmail(email), { redirectTo: `${origin()}/reset-password` });
  // Same answer whether or not the account exists, so emails can't be probed.
  if (error && !error.message.toLowerCase().includes("not found")) return { ok: false, error: friendlyAuthError(error.message) };
  return { ok: true };
}

/** Cloud mode: sets a new password for the user signed in through a reset link. */
export async function setNewPassword(password: string, confirm: string): Promise<{ ok: boolean; error?: string }> {
  if (password.length < 8) return { ok: false, error: "Use a password of at least 8 characters." };
  if (password !== confirm) return { ok: false, error: "The two passwords don't match." };
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Password reset isn't available on this site." };
  const { error } = await sb.auth.updateUser({ password });
  if (error) {
    const m = error.message.toLowerCase();
    if (m.includes("session") || m.includes("jwt")) return { ok: false, error: "This reset link has expired. Request a new one." };
    if (m.includes("different from the old")) return { ok: false, error: "Choose a password different from your current one." };
    return { ok: false, error: friendlyAuthError(error.message) };
  }
  return { ok: true };
}

let signedOutOnPurpose = false;

export async function logout(): Promise<void> {
  signedOutOnPurpose = true;
  const sb = getSupabase();
  if (sb) {
    const { data } = await sb.auth.getUser();
    await stopCloudSync();
    await sb.auth.signOut();
    // Don't leave this person's interviews in a shared browser.
    if (data.user) clearLocalCache(data.user.id);
    return;
  }
  remove(KEYS.current);
}

/** True once after an explicit sign-out, so protected pages send people home rather than to the login form. */
export function consumeSignOut(): boolean {
  const v = signedOutOnPurpose;
  signedOutOnPurpose = false;
  return v;
}

export function currentUser(): PublicUser | null {
  const cur = read<{ userId?: string } | null>(KEYS.current, null);
  if (!cur?.userId) return null;
  const user = read<StoredUser[]>(KEYS.users, []).find((u) => u.id === cur.userId);
  return user ? toPublic(user) : null;
}

export async function updateUser(userId: string, patch: Partial<Pick<StoredUser, "name" | "avatar">>): Promise<void> {
  const sb = getSupabase();
  if (sb) {
    if (patch.avatar !== undefined) updateProfile(userId, { avatar: patch.avatar });
    if (patch.name !== undefined) {
      const { error } = await sb.auth.updateUser({ data: { name: patch.name, avatar: null } });
      if (error) throw new Error(friendlyAuthError(error.message));
    }
    return;
  }
  const users = read<StoredUser[]>(KEYS.users, []);
  write(
    KEYS.users,
    users.map((u) => (u.id === userId ? { ...u, ...patch } : u)),
  );
}

export async function deleteAccount(userId: string): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.rpc("delete_my_account");
    if (error) return { ok: false, error: "Couldn't delete your account. Try again, or check your connection." };
    activeSync()?.stop();
    await stopCloudSync();
    signedOutOnPurpose = true;
    clearLocalCache(userId);
    await sb.auth.signOut();
    return { ok: true };
  }
  deleteAllUserData(userId);
  write(
    KEYS.users,
    read<StoredUser[]>(KEYS.users, []).filter((u) => u.id !== userId),
  );
  signedOutOnPurpose = true;
  remove(KEYS.current);
  return { ok: true };
}

interface LegacyUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  password?: string;
  resumeFileName?: string;
  createdAt?: string;
}

/** In-flight migration, shared by concurrent callers and cleared once finished. */
let migration: Promise<void> | null = null;

/**
 * The original app stored plaintext passwords and base64 resumes in localStorage.
 * Hash the passwords, drop the plaintext and the unused resume blobs, and keep the profiles.
 */
export function migrateLegacy(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  migration ??= (async () => {
    const legacy = read<LegacyUser[]>(KEYS.legacyUsers, []);
    if (!legacy.length) return;
    const users = read<StoredUser[]>(KEYS.users, []);
    const legacyCurrent = read<{ id?: string } | null>(KEYS.legacyCurrent, null);
    for (const lu of legacy) {
      const email = normaliseEmail(lu.email ?? "");
      if (!email || !lu.password || users.some((u) => u.email === email)) continue;
      const { hash, salt } = await hashPassword(lu.password);
      users.push({
        id: lu.id,
        name: lu.name,
        email,
        avatar: lu.avatar,
        createdAt: lu.createdAt ? Date.parse(lu.createdAt) || Date.now() : Date.now(),
        passwordHash: hash,
        salt,
      });
      if (lu.resumeFileName) {
        updateProfile(lu.id, { resumeFileName: lu.resumeFileName, resumeNeedsReupload: true });
      }
      remove(KEYS.legacyResume(lu.id));
    }
    write(KEYS.users, users);
    if (legacyCurrent?.id && users.some((u) => u.id === legacyCurrent.id)) {
      write(KEYS.current, { userId: legacyCurrent.id });
    }
    remove(KEYS.legacyUsers);
    remove(KEYS.legacyCurrent);
  })().finally(() => {
    migration = null;
  });
  return migration;
}
