"use client";

import Link from "next/link";
import { FORMATS, getTrack } from "@/lib/interview/catalog";
import type { InterviewSession } from "@/lib/interview/types";

export function SessionList({ sessions }: { sessions: InterviewSession[] }) {
  return (
    <ul className="divide-y divide-line">
      {sessions.map((s) => {
        const track = getTrack(s.config.trackId);
        const href = s.status === "in-progress" && !s.transcript.length ? `/interview/${s.id}` : `/report/${s.id}`;
        return (
          <li key={s.id}>
            <Link href={href} className="flex items-center justify-between gap-4 py-3 hover:bg-paper">
              <span className="min-w-0">
                <span className="block truncate font-bold">{s.config.roleTitle}</span>
                <span className="block truncate text-sm text-muted">
                  {track?.title ?? s.config.field} · {FORMATS[s.config.format].title} · {new Date(s.createdAt).toLocaleDateString()}
                </span>
              </span>
              <span className="shrink-0 text-right text-sm">
                {s.report ? (
                  s.report.overallScore !== null ? (
                    <span className="font-display text-xl font-bold tabular-nums">{s.report.overallScore}</span>
                  ) : (
                    <span className="text-muted">Report ready</span>
                  )
                ) : s.status === "in-progress" && !s.transcript.length ? (
                  <span className="font-bold text-indigo">Not started</span>
                ) : s.status === "abandoned" ? (
                  <span className="text-muted">No answers</span>
                ) : (
                  <span className="font-bold text-[#7a4f00]">Needs report</span>
                )}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
