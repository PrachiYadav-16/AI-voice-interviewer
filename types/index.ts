/**
 * Type definitions for IntervU application
 */

// Vapi SDK types
export interface VapiMessage {
  type: "transcript" | "function-call" | "speech-update" | "metadata";
  role?: "user" | "assistant";
  transcript?: string;
  transcriptType?: "partial" | "final";
  [key: string]: any;
}

export interface VapiStartConfig {
  model?: {
    provider: "openai" | "anthropic" | "together-ai";
    model: string;
    messages?: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }>;
    temperature?: number;
    maxTokens?: number;
  };
  voice?: {
    provider: "11labs" | "playht" | "rime-ai" | "deepgram";
    voiceId: string;
  };
  name?: string;
  firstMessage?: string;
  transcriber?: {
    provider: "deepgram";
    model?: string;
    language?: string;
  };
}

// Application types
export type InterviewStatus =
  | "idle"
  | "connecting"
  | "ai-speaking"
  | "user-speaking"
  | "processing";

export interface TranscriptMessage {
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

export interface InterviewProps {
  vapiApiKey: string;
}

export interface VoiceVisualizerProps {
  isActive: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  onClick: () => void;
}

export interface StatusIndicatorProps {
  status: InterviewStatus;
}

export interface TranscriptPanelProps {
  messages: TranscriptMessage[];
}
