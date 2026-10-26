"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { login, resetPassword, signup, validateSignup } from "@/lib/auth";
import { useAuth } from "./AuthProvider";
import { Logo } from "./Headers";
import { AvatarPicker, DEFAULT_AVATARS } from "./AvatarPicker";
import { Check, Info } from "lucide-react";
import { Button, Notice, TextField } from "./ui";

function safeNext(next: string | null): string {
  // Only allow same-site relative paths to avoid open redirects.
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      {/* Brand panel (desktop) */}
      <aside className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="absolute inset-y-0 right-0 w-1.5 bg-marigold" />
        <Logo className="relative text-white" />
        <div className="relative max-w-md space-y-6">
          <p className="font-display text-3xl font-extrabold leading-tight">Practise out loud. Get feedback on what you actually said.</p>
          <ul className="space-y-3 text-white/80">
            {[
              "UPSC, SSB, banking, PSU and private-sector interviews",
              "Follow-up questions based on your answers",
              "Rubric-based report for every answer",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-marigold" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-white/50">A practice tool. Feedback is AI-generated and doesn&apos;t predict selection.</p>
      </aside>

      <div className="flex flex-col">
        <div className="flex h-16 items-center px-4 sm:px-8 lg:hidden">
          <Logo />
        </div>
        <main id="main" className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 pb-16 pt-6 lg:py-16">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl">{title}</h1>
            <p className="text-muted">{subtitle}</p>
          </div>
          <div className="rounded-[var(--radius-card)] border border-line bg-surface p-6 shadow-[var(--shadow-card)]">{children}</div>
          <p className="flex gap-2 text-sm text-muted">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              Accounts and interview history are stored in this browser only, and don&apos;t sync to other devices.{" "}
              <Link href="/privacy" className="font-semibold text-ink underline">
                How your data is handled
              </Link>
            </span>
          </p>
        </main>
      </div>
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
          <Link href="/forgot-password" className="font-semibold text-indigo hover:underline">
            Forgot password?
          </Link>
        </p>
        <Button type="submit" loading={busy} className="w-full">
          Log in
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        New here?{" "}
        <Link href={`/signup${next !== "/dashboard" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-indigo hover:underline">
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
      <p className="mt-5 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-indigo hover:underline">
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
      <p className="mt-5 text-center text-sm text-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-indigo hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
