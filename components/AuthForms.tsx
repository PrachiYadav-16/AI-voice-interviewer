"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { cloudEnabled, login, requestPasswordReset, resetPassword, setNewPassword, signup, validateSignup } from "@/lib/auth";
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
              {cloudEnabled
                ? "Your account and interview history are saved to your account, so you can use them on any device. "
                : "Accounts and interview history are stored in this browser only, and don't sync to other devices. "}
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

function useRedirectIfSignedIn(firstVisitTarget?: string) {
  const { user } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  useEffect(() => {
    if (user) router.replace(firstVisitTarget && next === "/dashboard" ? firstVisitTarget : next);
  }, [user, router, next, firstVisitTarget]);
  return next;
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
    if (res.ok === false) {
      setBusy(false);
      return setError(res.error);
    }
    // In cloud mode the account's data loads first; the redirect above fires once it's ready.
    if (!cloudEnabled) router.replace(next);
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
  const [goTo, setGoTo] = useState<string>();
  const next = useRedirectIfSignedIn(goTo);
  const router = useRouter();
  const [confirmEmail, setConfirmEmail] = useState<string>();
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
      if (res.ok === false) return setError(res.error);
      if (res.ok === "confirm") return setConfirmEmail(res.email);
      if (cloudEnabled) setGoTo("/practice");
      else router.replace(next === "/dashboard" ? "/practice" : next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the account.");
    } finally {
      setBusy(false);
    }
  };

  if (confirmEmail) {
    return (
      <AuthShell title="Check your email" subtitle="One more step to finish creating your account.">
        <div className="space-y-4">
          <Notice tone="success" title="Confirmation link sent">
            We sent a link to <strong>{confirmEmail}</strong>. Open it on this device to confirm your account and sign in.
          </Notice>
          <p className="text-sm text-muted">Not there after a few minutes? Check your spam folder, or sign up again with the right address.</p>
          <Link href="/login" className="block text-center text-sm font-semibold text-indigo hover:underline">
            Back to log in
          </Link>
        </div>
      </AuthShell>
    );
  }

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
  return cloudEnabled ? <EmailResetForm /> : <DeviceResetForm />;
}

function EmailResetForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setBusy(true);
    const res = await requestPasswordReset(email);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setSent(true);
  };

  return (
    <AuthShell title="Reset your password" subtitle="Enter your account's email and we'll send you a link to choose a new password.">
      {sent ? (
        <div className="space-y-4">
          <Notice tone="success" title="Check your email">
            If an account exists for <strong>{email.trim()}</strong>, a reset link is on its way. Open it on this device.
          </Notice>
          <p className="text-sm text-muted">The link expires after a while. Not there in a few minutes? Check spam, or request another.</p>
          <Button variant="secondary" className="w-full" onClick={() => setSent(false)}>
            Send another link
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          {error && (
            <Notice tone="error" role="alert">
              {error}
            </Notice>
          )}
          <TextField label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Button type="submit" loading={busy} className="w-full">
            Send reset link
          </Button>
        </form>
      )}
      <p className="mt-5 text-center text-sm text-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-indigo hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}

/** Page opened from the reset email. Supabase signs the person in from the link. */
export function NewPasswordForm() {
  const { user } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setBusy(true);
    const res = await setNewPassword(form.password, form.confirm);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    router.replace("/dashboard");
  };

  if (!cloudEnabled) {
    return (
      <AuthShell title="Reset your password" subtitle="This site doesn't send reset emails.">
        <Link href="/forgot-password" className="font-semibold text-indigo hover:underline">
          Reset your password here
        </Link>
      </AuthShell>
    );
  }
  if (user === undefined) {
    return (
      <AuthShell title="Choose a new password" subtitle="Checking your reset link…">
        <p role="status" className="text-muted">
          One moment…
        </p>
      </AuthShell>
    );
  }
  if (user === null) {
    return (
      <AuthShell title="This reset link didn't work" subtitle="Reset links work once, for a limited time, and only in the browser where you asked for them.">
        <ul className="mb-5 list-disc space-y-1.5 pl-5 text-[0.95rem] text-muted">
          <li>Open the link in the same browser you used to request it, not in a phone mail app or another browser.</li>
          <li>If you asked more than once, only the newest email works.</li>
        </ul>
        <Link href="/forgot-password" className="font-semibold text-indigo hover:underline">
          Request a new reset link
        </Link>
      </AuthShell>
    );
  }
  return (
    <AuthShell title="Choose a new password" subtitle={`For ${user.email}.`}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && (
          <Notice tone="error" role="alert">
            {error}
          </Notice>
        )}
        <TextField
          label="New password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters."
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          required
        />
        <TextField
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
          required
        />
        <Button type="submit" loading={busy} className="w-full">
          Save new password
        </Button>
      </form>
    </AuthShell>
  );
}

function DeviceResetForm() {
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
    if (res.ok === false) return setError(res.error);
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
