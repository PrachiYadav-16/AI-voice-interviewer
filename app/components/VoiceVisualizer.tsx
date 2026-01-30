"use client";

import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceVisualizerProps {
  isActive: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  onClick: () => void;
}

export function VoiceVisualizer({
  isActive,
  isSpeaking,
  isListening,
  onClick,
}: VoiceVisualizerProps) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow rings */}
      {isActive && (
        <>
          <div
            className={cn(
              "absolute h-80 w-80 rounded-full opacity-20",
              isSpeaking && "animate-pulse bg-accent-purple/30 blur-3xl",
              isListening && "animate-glow-blue bg-accent-blue/30 blur-3xl"
            )}
          />
          <div
            className={cn(
              "absolute h-64 w-64 rounded-full opacity-40",
              isSpeaking && "animate-pulse-slow bg-accent-purple/40 blur-2xl",
              isListening && "animate-glow bg-accent-blue/40 blur-2xl"
            )}
          />
        </>
      )}

      {/* Main mic button */}
      <button
        onClick={onClick}
        className={cn(
          "relative z-10 flex h-32 w-32 items-center justify-center rounded-full border-2 transition-all duration-300",
          "hover:scale-105 active:scale-95",
          isActive
            ? "border-white/20 bg-gradient-to-br from-accent-purple to-accent-blue shadow-2xl"
            : "border-white/10 bg-midnight-lighter hover:border-white/30"
        )}
      >
        {/* Inner glow */}
        {isActive && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent-purple to-accent-blue opacity-50 blur-xl" />
        )}

        {/* Icon */}
        {isActive ? (
          <Mic className="relative z-10 h-12 w-12 text-white drop-shadow-lg" />
        ) : (
          <MicOff className="relative z-10 h-12 w-12 text-white/60" />
        )}
      </button>

      {/* Audio wave bars (when speaking) */}
      {isSpeaking && (
        <div className="absolute bottom-0 flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-2 w-1 rounded-full bg-accent-purple"
              style={{
                animation: `wave 1s ease-in-out infinite`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
