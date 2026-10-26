"use client";

import { Mic, MicOff } from "lucide-react";
import type { Floor, Phase } from "@/lib/interview/session";
import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = {
  idle: "Not started",
  "requesting-mic": "Checking your microphone…",
  connecting: "Connecting to your interviewer…",
  interviewer: "Interviewer is speaking",
  candidate: "Listening to you",
  processing: "Thinking about your answer…",
  waiting: "Your turn, take your time",
  paused: "Paused",
  ending: "Wrapping up…",
  ended: "Interview finished",
  failed: "Disconnected",
};

export function statusLabel(phase: Phase, floor: Floor, muted: boolean): string {
  if (phase === "active") return muted && floor !== "interviewer" ? "Your microphone is muted" : LABELS[floor];
  return LABELS[phase];
}

/**
 * The interviewer's presence. The ring scales with the real output level reported by
 * the voice SDK, so it moves only when audio is actually playing.
 */
export function InterviewerPresence({ level, floor, phase }: { level: number; floor: Floor; phase: Phase }) {
  const live = phase === "active";
  const speaking = live && floor === "interviewer";
  const scale = speaking ? 1 + Math.min(level, 1) * 0.35 : 1;
  return (
    <div className="relative grid h-36 w-36 place-items-center sm:h-44 sm:w-44" aria-hidden>
      <div
        className={cn(
          "absolute inset-0 rounded-full transition-[transform,background-color] duration-150 ease-out",
          speaking ? "bg-indigo/15" : "bg-line/50",
        )}
        style={{ transform: `scale(${scale})` }}
      />
      <div
        className={cn(
          "relative grid h-24 w-24 place-items-center rounded-full sm:h-28 sm:w-28",
          live ? "bg-indigo text-white" : "bg-surface text-muted ring-1 ring-line",
          phase === "connecting" && "animate-pulse",
        )}
      >
        <div className="flex h-8 items-center gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="w-1.5 origin-center rounded-full bg-current"
              style={{
                height: "100%",
                animation: speaking ? `speaking 0.9s ease-in-out ${i * 0.12}s infinite` : undefined,
                transform: speaking ? undefined : "scaleY(0.3)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Microphone state with a live input meter, so people can see that they're being heard. */
export function MicMeter({ level, muted, active }: { level: number; muted: boolean; active: boolean }) {
  const bars = 12;
  const lit = muted || !active ? 0 : Math.round(Math.min(1, level * 3) * bars);
  return (
    <div className="flex items-center gap-2" aria-label={muted ? "Microphone muted" : "Microphone on"} role="img">
      {muted ? <MicOff className="h-5 w-5 text-brick" aria-hidden /> : <Mic className="h-5 w-5 text-ink" aria-hidden />}
      <div className="flex h-4 items-end gap-0.5" aria-hidden>
        {Array.from({ length: bars }, (_, i) => (
          <span
            key={i}
            className={cn("w-1 rounded-sm", i < lit ? "bg-marigold" : "bg-line")}
            style={{ height: `${30 + (i / bars) * 70}%` }}
          />
        ))}
      </div>
    </div>
  );
}
