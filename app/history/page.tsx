"use client";

import { useState } from "react";
import { RequireAuth } from "@/components/AuthProvider";
import { AppShell } from "@/components/Headers";
import { SessionList } from "@/components/SessionList";
import { ButtonLink, Card, PageTitle, SelectField } from "@/components/ui";
import { useSessions } from "@/lib/hooks/useUserData";
import { CATEGORIES } from "@/lib/interview/catalog";

export default function HistoryPage() {
  return (
    <AppShell>
      <RequireAuth>{(user) => <History userId={user.id} />}</RequireAuth>
    </AppShell>
  );
}

function History({ userId }: { userId: string }) {
  const sessions = useSessions(userId);
  const [category, setCategory] = useState("all");
  const shown = category === "all" ? sessions : sessions.filter((s) => s.config.category === category);

  return (
    <>
      <PageTitle
        title="History"
        description="Interviews saved in this browser. Open one to see its report and transcript, or delete it from there."
        actions={<ButtonLink href="/practice">New interview</ButtonLink>}
      />
      {sessions.length === 0 ? (
        <Card className="max-w-xl space-y-3">
          <p>No interviews yet. Your transcripts and reports will be listed here.</p>
          <ButtonLink href="/practice">Set up your first interview</ButtonLink>
        </Card>
      ) : (
        <Card>
          <SelectField
            label="Show"
            className="mb-4 max-w-xs"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[{ value: "all", label: `All interviews (${sessions.length})` }, ...CATEGORIES.map((c) => ({ value: c.id, label: c.title }))]}
          />
          {shown.length ? <SessionList sessions={shown} /> : <p className="py-6 text-muted">No interviews in this category yet.</p>}
        </Card>
      )}
    </>
  );
}
