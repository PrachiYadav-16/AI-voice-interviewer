"use client";

import { Suspense } from "react";
import { RequireAuth } from "@/components/AuthProvider";
import { AppShell } from "@/components/Headers";
import { SetupFlow } from "./SetupFlow";

export default function PracticePage() {
  return (
    <AppShell>
      <RequireAuth>
        {(user) => (
          <Suspense>
            <SetupFlow user={user} />
          </Suspense>
        )}
      </RequireAuth>
    </AppShell>
  );
}
