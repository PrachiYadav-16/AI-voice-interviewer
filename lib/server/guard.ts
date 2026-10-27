import "server-only";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Best-effort abuse protection for the AI endpoints.
 * The limiter is in-memory, so on serverless hosts it applies per instance. For
 * strict limits put a shared store (e.g. Redis) or the host's firewall in front.
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): { ok: boolean; retryAfter: number } {
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 5000) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    }
    return { ok: true, retryAfter: 0 };
  }
  bucket.count += 1;
  if (bucket.count > limit) return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  return { ok: true, retryAfter: 0 };
}

export function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}

/** Rejects cross-site POSTs so other sites can't spend this deployment's AI credits. */
export function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return req.headers.get("sec-fetch-site") !== "cross-site";
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

export function jsonError(status: number, error: string, extra?: Record<string, unknown>, headers?: HeadersInit) {
  return NextResponse.json({ error, ...extra }, { status, headers });
}

// ───────────── Account check (only when Supabase is configured) ─────────────

const verified = new Map<string, { userId: string; until: number }>();

export function authRequired(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

/** Verifies the Supabase access token sent by the browser. Returns the user id, or null. */
export async function verifyUser(req: NextRequest, now = Date.now()): Promise<string | null> {
  const token = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token || token.length > 4096) return null;
  const hit = verified.get(token);
  if (hit && hit.until > now) return hit.userId;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, "")}/auth/v1/user`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const user = (await res.json()) as { id?: string };
    if (!user.id) return null;
    verified.set(token, { userId: user.id, until: now + 60_000 });
    if (verified.size > 2000) for (const [k, v] of verified) if (v.until <= now) verified.delete(k);
    return user.id;
  } catch {
    return null;
  }
}

/** Common checks for every AI route. Returns a response to send, or null to continue. */
export async function guard(req: NextRequest, name: string, limit: number, windowMs = 60 * 60 * 1000) {
  if (!sameOrigin(req)) return jsonError(403, "Requests must come from the IntervU site.");
  let who = clientIp(req);
  if (authRequired()) {
    const userId = await verifyUser(req);
    if (!userId) return jsonError(401, "Your session has expired. Log in again and retry.", { code: "auth" });
    who = `u:${userId}`;
  }
  const rl = rateLimit(`${name}:${who}`, limit, windowMs);
  if (!rl.ok) {
    return jsonError(429, "Too many requests. Please wait before trying again.", { retryAfter: rl.retryAfter }, { "Retry-After": String(rl.retryAfter) });
  }
  return null;
}

export async function readJson(req: NextRequest, maxBytes: number): Promise<unknown> {
  const len = Number(req.headers.get("content-length") || 0);
  if (len > maxBytes) throw new Error("too-large");
  const text = await req.text();
  if (text.length > maxBytes) throw new Error("too-large");
  return JSON.parse(text);
}
