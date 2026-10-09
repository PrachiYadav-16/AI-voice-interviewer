"use client";

import { Suspense, use } from "react";
import { RequireAuth } from "@/components/AuthProvider";
import { AppShell } from "@/components/Headers";
import { ReportView } from "./ReportView";

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AppShell>
      <RequireAuth>
        {(user) => (
          <Suspense>
            <ReportView userId={user.id} sessionId={id} />
          </Suspense>
        )}
      </RequireAuth>
    </AppShell>
  );
}
