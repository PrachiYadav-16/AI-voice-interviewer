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

/** Common checks for every AI route. Returns a response to send, or null to continue. */
export function guard(req: NextRequest, name: string, limit: number, windowMs = 60 * 60 * 1000) {
  if (!sameOrigin(req)) return jsonError(403, "Requests must come from the IntervU site.");
  const rl = rateLimit(`${name}:${clientIp(req)}`, limit, windowMs);
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
