"use client";

import { use } from "react";
import { RequireAuth } from "@/components/AuthProvider";
import { LiveInterview } from "./LiveInterview";

export default function InterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <RequireAuth>{(user) => <LiveInterview userId={user.id} sessionId={id} />}</RequireAuth>;
}
