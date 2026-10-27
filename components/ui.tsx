"use client";

import Link from "next/link";
import { forwardRef, useEffect, useId, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Eye, EyeOff, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

import { buttonClass, type Size, type Variant } from "./buttonClass";

export { buttonClass };

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean }
>(function Button({ variant = "primary", size = "md", loading, className, children, disabled, ...rest }, ref) {
  return (
    <button
      ref={ref}
      className={buttonClass(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden />
      )}
      {children}
    </button>
  );
});

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}

const inputClass =
  "w-full rounded-[var(--radius-control)] border border-line bg-surface px-3.5 py-2.5 text-ink shadow-[0_1px_2px_rgb(18_26_47/0.04)] transition-[border-color,box-shadow] placeholder:text-muted/60 hover:border-line-strong focus:border-indigo focus:outline-none focus:ring-4 focus:ring-indigo/15 aria-[invalid=true]:border-brick";

export function TextField({
  label,
  hint,
  error,
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string }) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const isPassword = rest.type === "password";
  const input = (
    <input
      id={id}
      className={cn(inputClass, isPassword && "pr-11")}
      aria-invalid={error ? true : undefined}
      aria-describedby={hint || error ? `${id}-d` : undefined}
      {...rest}
      type={isPassword && shown ? "text" : rest.type}
    />
  );
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-semibold text-ink/90">
        {label}
      </label>
      {isPassword ? (
        <div className="relative">
          {input}
          <button
            type="button"
            onClick={() => setShown((v) => !v)}
            aria-label={shown ? "Hide password" : "Show password"}
            aria-pressed={shown}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-indigo"
          >
            {shown ? <EyeOff className="size-[18px]" aria-hidden /> : <Eye className="size-[18px]" aria-hidden />}
          </button>
        </div>
      ) : (
        input
      )}
      {(hint || error) && (
        <p id={`${id}-d`} className={cn("text-sm", error ? "text-brick" : "text-muted")}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

export function TextArea({
  label,
  hint,
  error,
  className,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string; error?: string }) {
  const id = useId();
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-semibold text-ink/90">
        {label}
      </label>
      <textarea
        id={id}
        className={cn(inputClass, "min-h-28 resize-y")}
        aria-invalid={error ? true : undefined}
        aria-describedby={hint || error ? `${id}-d` : undefined}
        {...rest}
      />
      {(hint || error) && (
        <p id={`${id}-d`} className={cn("text-sm", error ? "text-brick" : "text-muted")}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

export function SelectField({
  label,
  hint,
  options,
  className,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: string;
  options: { value: string; label: string }[];
}) {
  const id = useId();
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-semibold text-ink/90">
        {label}
      </label>
      <select id={id} className={inputClass} {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <p className="text-sm text-muted">{hint}</p>}
    </div>
  );
}

/** Radio group rendered as selectable tiles. Native radios keep keyboard support intact. */
export function ChoiceGroup<T extends string>({
  legend,
  name,
  value,
  onChange,
  options,
  columns = "sm:grid-cols-2",
  hint,
}: {
  legend: string;
  name: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; description?: string; note?: React.ReactNode }[];
  columns?: string;
  hint?: string;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-1 text-sm font-semibold text-ink/90">{legend}</legend>
      {hint && <p className="-mt-1 mb-2 text-sm text-muted">{hint}</p>}
      <div className={cn("grid grid-cols-1 gap-2", columns)}>
        {options.map((o) => {
          const checked = o.value === value;
          return (
            <label
              key={o.value}
              className={cn(
                "relative flex cursor-pointer flex-col gap-0.5 rounded-[var(--radius-control)] border bg-surface px-4 py-3 pr-9 transition-[border-color,background-color,box-shadow] has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-indigo/20",
                checked ? "border-indigo bg-indigo-soft/50 shadow-[inset_0_0_0_1px_var(--color-indigo)]" : "border-line hover:border-line-strong hover:bg-paper/60",
              )}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={checked}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              <span
                aria-hidden
                className={cn(
                  "absolute right-3.5 top-3.5 grid h-4 w-4 place-items-center rounded-full border",
                  checked ? "border-indigo bg-indigo" : "border-line-strong bg-surface",
                )}
              >
                {checked && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </span>
              <span className="font-semibold">{o.label}</span>
              {o.description && <span className="text-sm text-muted">{o.description}</span>}
              {o.note}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

const noticeStyles = {
  info: { box: "border-indigo/25 bg-indigo-soft/70", icon: Info, iconClass: "text-indigo" },
  warning: { box: "border-marigold/40 bg-marigold-soft", icon: AlertTriangle, iconClass: "text-[#9a6400]" },
  error: { box: "border-brick/30 bg-brick-soft", icon: XCircle, iconClass: "text-brick" },
  success: { box: "border-sage/30 bg-sage-soft", icon: CheckCircle2, iconClass: "text-sage" },
};

export function Notice({
  tone = "info",
  title,
  children,
  className,
  role,
}: {
  tone?: keyof typeof noticeStyles;
  title?: string;
  children?: React.ReactNode;
  className?: string;
  role?: "alert" | "status";
}) {
  const s = noticeStyles[tone];
  const Icon = s.icon;
  return (
    <div className={cn("flex gap-3 rounded-[var(--radius-control)] border px-4 py-3", s.box, className)} role={role}>
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", s.iconClass)} aria-hidden />
      <div className="min-w-0 space-y-1 text-[0.95rem] [overflow-wrap:anywhere]">
        {title && <p className="font-bold">{title}</p>}
        {children && <div className="text-ink/85">{children}</div>}
      </div>
    </div>
  );
}

/** Native <dialog> for focus trapping and Escape handling. */
export function ConfirmDialog({
  open,
  title,
  children,
  onClose,
  actions,
}: {
  open: boolean;
  title: string;
  children?: React.ReactNode;
  onClose: () => void;
  actions: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      className="m-auto w-[min(92vw,30rem)] rounded-[var(--radius-card)] border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-ink/40 backdrop:backdrop-blur-[2px]"
      aria-labelledby="dlg-title"
    >
      <div className="space-y-3 p-6">
        <h2 id="dlg-title" className="text-xl">
          {title}
        </h2>
        {children && <div className="text-muted">{children}</div>}
        <div className="flex flex-wrap justify-end gap-2 pt-2">{actions}</div>
      </div>
    </dialog>
  );
}

export function Card({ className, children, as: As = "section" }: { className?: string; children: React.ReactNode; as?: "section" | "div" | "article" }) {
  return <As className={cn("rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6", className)}>{children}</As>;
}

export function PageTitle({ title, description, actions }: { title: string; description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl space-y-2">
        <h1 className="text-3xl sm:text-[2.5rem]">{title}</h1>
        {description && <div className="text-lg text-muted">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** Profile picture with an initial-letter fallback when the image can't load. */
export function Avatar({ src, name, className }: { src?: string; name: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  if (!src || failed) {
    return (
      <span aria-hidden className={cn("grid place-items-center rounded-full bg-indigo-soft font-bold text-indigo", className)}>
        {initial}
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element -- user data URLs and remote SVG avatars
  return <img src={src} alt="" onError={() => setFailed(true)} className={cn("rounded-full border border-line bg-surface object-cover", className)} />;
}

/** Small number tile for dashboards. Only ever fed real, computed values. */
export function StatTile({ label, value, hint, icon }: { label: string; value: React.ReactNode; hint?: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between gap-2 text-sm text-muted">
        <span>{label}</span>
        {icon && <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-soft text-indigo">{icon}</span>}
      </div>
      <p className="mt-2 font-display text-3xl font-extrabold tabular-nums tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
    </div>
  );
}
