"use client";

import { accessToken } from "@/lib/supabase";

/** fetch() for this app's own API routes, adding the signed-in user's token when there is one. */
export async function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const token = await accessToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(url, { ...init, headers });
}
