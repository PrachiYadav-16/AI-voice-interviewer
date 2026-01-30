"use client";

import { User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TranscriptMessage {
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

interface TranscriptPanelProps {
  messages: TranscriptMessage[];
}

export function TranscriptPanel({ messages }: TranscriptPanelProps) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-midnight-lighter/50 backdrop-blur-sm">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <h3 className="text-lg font-semibold text-white">Live Transcript</h3>
        <p className="text-sm text-white/50">Real-time conversation</p>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-white/30">
            <p className="text-sm">Transcript will appear here...</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={cn(
                "flex gap-3 rounded-lg p-4",
                msg.role === "assistant"
                  ? "bg-accent-purple/10 border border-accent-purple/20"
                  : "bg-accent-blue/10 border border-accent-blue/20"
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  msg.role === "assistant"
                    ? "bg-accent-purple/20"
                    : "bg-accent-blue/20"
                )}
              >
                {msg.role === "assistant" ? (
                  <Bot className="h-4 w-4 text-accent-purple" />
                ) : (
                  <User className="h-4 w-4 text-accent-blue" />
                )}
              </div>

              {/* Message content */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-white/70">
                    {msg.role === "assistant" ? "AI Interviewer" : "You"}
                  </span>
                  <span className="text-xs text-white/40">
                    {msg.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-white/90">
                  {msg.text}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
