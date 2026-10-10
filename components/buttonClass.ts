import { cn } from "@/lib/utils";

/** Pure class helper, usable from server and client components. */
export type Variant = "primary" | "secondary" | "ghost" | "danger";
export type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-semibold tracking-[-0.005em] transition-[background-color,border-color,box-shadow,transform] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55 disabled:active:translate-y-0 whitespace-nowrap";
const variants: Record<Variant, string> = {
  primary:
    "bg-indigo text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_1px_2px_rgb(18_26_47/0.2),0_6px_16px_-6px_rgb(61_75_214/0.6)] hover:bg-indigo-deep",
  secondary: "border border-line bg-surface text-ink shadow-[var(--shadow-card)] hover:border-line-strong hover:bg-paper",
  ghost: "text-ink hover:bg-indigo-soft",
  danger: "border border-brick/40 bg-surface text-brick hover:bg-brick-soft",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-[0.95rem]",
  lg: "h-13 px-7 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return cn(base, variants[variant], sizes[size], extra);
}

