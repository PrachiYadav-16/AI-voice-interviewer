"use client";

import { useEffect, useRef } from "react";
import type { Speaker, TranscriptTurn } from "@/lib/interview/types";
import { cn } from "@/lib/utils";

export function TranscriptList({
  turns,
  partial,
  autoScroll = true,
  className,
}: {
  turns: TranscriptTurn[];
  partial?: Partial<Record<Speaker, string>>;
  autoScroll?: boolean;
  className?: string;
}) {
  const end = useRef<HTMLLIElement>(null);
  useEffect(() => {
    if (autoScroll) end.current?.scrollIntoView({ block: "nearest" });
  }, [turns.length, partial?.candidate, partial?.interviewer, autoScroll]);

  const items: { key: string; speaker: Speaker; text: string; pending?: boolean }[] = turns.map((t) => ({
    key: t.id,
    speaker: t.speaker,
    text: t.text,
  }));
  (["interviewer", "candidate"] as const).forEach((s) => {
    if (partial?.[s]) items.push({ key: `partial-${s}`, speaker: s, text: partial[s]!, pending: true });
  });

  if (!items.length) {
    return <p className={cn("text-muted", className)}>The conversation will appear here as you speak.</p>;
  }

  return (
    <ol className={cn("space-y-4", className)} aria-live="polite" aria-relevant="additions">
      {items.map((t) => (
        <li key={t.key} className="grid grid-cols-[5.5rem_1fr] gap-3">
          <span className={cn("pt-0.5 text-sm font-bold", t.speaker === "interviewer" ? "text-indigo" : "text-ink")}>
            {t.speaker === "interviewer" ? "Interviewer" : "You"}
          </span>
          <p className={cn("leading-relaxed", t.pending && "text-muted italic")}>{t.text}</p>
        </li>
      ))}
      <li ref={end} aria-hidden className="h-0" />
    </ol>
  );
}
