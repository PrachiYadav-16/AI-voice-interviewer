"use client";

import { cn } from "@/lib/utils";

export type InterviewStatus =
  | "idle"
  | "connecting"
  | "ai-speaking"
  | "user-speaking"
  | "processing";

interface StatusIndicatorProps {
  status: InterviewStatus;
}

const statusConfig = {
  idle: {
    label: "Ready to Start",
    color: "bg-zinc-500",
    pulse: false,
  },
  connecting: {
    label: "Connecting...",
    color: "bg-yellow-500",
    pulse: true,
  },
  "ai-speaking": {
    label: "AI Speaking",
    color: "bg-accent-purple",
    pulse: true,
  },
  "user-speaking": {
    label: "User Speaking",
    color: "bg-accent-blue",
    pulse: true,
  },
  processing: {
    label: "Processing...",
    color: "bg-yellow-400",
    pulse: true,
  },
};

export function StatusIndicator({ status }: StatusIndicatorProps) {
  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-3 rounded-full border border-white/10 bg-midnight-lighter px-6 py-3 backdrop-blur-sm">
      <div className="relative flex items-center justify-center">
        <div
          className={cn(
            "h-3 w-3 rounded-full",
            config.color,
            config.pulse && "animate-pulse"
          )}
        />
        {config.pulse && (
          <div
            className={cn(
              "absolute h-3 w-3 rounded-full animate-ping",
              config.color,
              "opacity-75"
            )}
          />
        )}
      </div>
      <span className="text-sm font-medium text-white/90">{config.label}</span>
    </div>
  );
}
