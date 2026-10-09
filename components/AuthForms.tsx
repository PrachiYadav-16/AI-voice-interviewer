"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { login, resetPassword, signup, validateSignup } from "@/lib/auth";
import { useAuth } from "./AuthProvider";
import { Logo } from "./Headers";
import { AvatarPicker, DEFAULT_AVATARS } from "./AvatarPicker";
import { Button, Notice, TextField } from "./ui";

function safeNext(next: string | null): string {
  // Only allow same-site relative paths to avoid open redirects.
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
        <Logo />
      </div>
      <main id="main" className="mx-auto grid max-w-md gap-6 px-4 pb-16 pt-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted">{subtitle}</p>
        </div>
        {children}
        <Notice tone="info">
          Accounts and interview history are stored in this browser only. They don&apos;t sync to other devices, and clearing
          site data removes them. <Link href="/privacy" className="font-bold underline">How your data is handled</Link>
        </Notice>
      </main>
    </div>
  );
}

function useRedirectIfSignedIn() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  useEffect(() => {
    if (user) router.replace(safeNext(params.get("next")));
  }, [user, router, params]);
  return safeNext(params.get("next"));
}

export function LoginForm() {
  const next = useRedirectIfSignedIn();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    if (!email.trim() || !password) return setError("Enter your email and password.");
    setBusy(true);
    const res = await login(email, password);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    router.replace(next);
  };

  return (
    <AuthShell title="Log in" subtitle="Pick up where you left off.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && (
          <Notice tone="error" role="alert">
            {error}
          </Notice>
        )}
        <TextField label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <p className="-mt-2 text-right text-sm">
          <Link href="/forgot-password" className="font-bold text-indigo underline">
            Forgot password?
          </Link>
        </p>
        <Button type="submit" loading={busy} className="w-full">
          Log in
        </Button>
      </form>
      <p className="text-muted">
        New here?{" "}
        <Link href={`/signup${next !== "/dashboard" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-bold text-indigo underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}

export function SignupForm() {
  const next = useRedirectIfSignedIn();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [avatar, setAvatar] = useState(DEFAULT_AVATARS[0]);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validateSignup(form);
    if (problem) return setError(problem);
    setError(undefined);
    setBusy(true);
    try {
      const res = await signup({ name: form.name, email: form.email, password: form.password, avatar });
      if (!res.ok) return setError(res.error);
      router.replace(next === "/dashboard" ? "/practice" : next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the account.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Takes a few seconds. You can add a resume later when you set up an interview.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && (
          <Notice tone="error" role="alert">
            {error}
          </Notice>
        )}
        <TextField label="Name" autoComplete="name" value={form.name} onChange={set("name")} required />
        <TextField label="Email" type="email" autoComplete="email" value={form.email} onChange={set("email")} required />
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters."
          value={form.password}
          onChange={set("password")}
          required
        />
        <TextField label="Confirm password" type="password" autoComplete="new-password" value={form.confirm} onChange={set("confirm")} required />
        <AvatarPicker value={avatar} onChange={setAvatar} />
        <Button type="submit" loading={busy} className="w-full">
          Create account
        </Button>
      </form>
      <p className="text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-indigo underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}

export function ForgotPasswordForm() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", name: "", password: "", confirm: "" });
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    if (!form.email.trim() || !form.name.trim()) return setError("Enter the email and name you signed up with.");
    setBusy(true);
    const res = await resetPassword(form);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    router.replace("/dashboard");
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Your account is stored in this browser, so there's no reset email. Confirm the email and name you signed up with, then choose a new password. Your interview history is kept."
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && (
          <Notice tone="error" role="alert">
            {error}
          </Notice>
        )}
        <TextField label="Email" type="email" autoComplete="email" value={form.email} onChange={set("email")} required />
        <TextField label="Name on the account" autoComplete="name" value={form.name} onChange={set("name")} required />
        <TextField label="New password" type="password" autoComplete="new-password" hint="At least 8 characters." value={form.password} onChange={set("password")} required />
        <TextField label="Confirm new password" type="password" autoComplete="new-password" value={form.confirm} onChange={set("confirm")} required />
        <Button type="submit" loading={busy} className="w-full">
          Reset password and log in
        </Button>
      </form>
      <p className="text-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-bold text-indigo underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
