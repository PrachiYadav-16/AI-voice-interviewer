"use client";

import { useEffect, useState } from "react";

export interface ServiceStatus {
  voice: boolean;
  ai: boolean;
}

let cached: Promise<ServiceStatus> | null = null;

function load(): Promise<ServiceStatus> {
  cached ??= fetch("/api/status")
    .then((r) => (r.ok ? (r.json() as Promise<ServiceStatus>) : { voice: false, ai: false }))
    .catch(() => {
      cached = null;
      return { voice: false, ai: false };
    });
  return cached;
}

/** Which back-end services this deployment has configured. undefined while loading. */
export function useServiceStatus(): ServiceStatus | undefined {
  const [status, setStatus] = useState<ServiceStatus>();
  useEffect(() => {
    let alive = true;
    void load().then((s) => alive && setStatus(s));
    return () => {
      alive = false;
    };
  }, []);
  return status;
}
