"use client";

import { useState, useEffect, useCallback } from "react";
import Vapi from "@vapi-ai/web";
import { VoiceVisualizer } from "./VoiceVisualizer";
import { StatusIndicator, type InterviewStatus } from "./StatusIndicator";
import { TranscriptPanel, type TranscriptMessage } from "./TranscriptPanel";
import { PhoneOff } from "lucide-react";
import { JobRole } from "@/types/jobRoles";

interface InterviewProps {
  vapiApiKey: string;
  jobRole: JobRole;
}

export function Interview({ vapiApiKey, jobRole }: InterviewProps) {
  const [vapi, setVapi] = useState<Vapi | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [status, setStatus] = useState<InterviewStatus>("idle");
  const [transcripts, setTranscripts] = useState<TranscriptMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Initialize Vapi
  useEffect(() => {
    if (!vapiApiKey || vapiApiKey === "YOUR_VAPI_API_KEY_HERE") {
      console.error("Please set your Vapi API key in .env.local");
      return;
    }

    try {
      const vapiInstance = new Vapi(vapiApiKey);
      setVapi(vapiInstance);

      // Event listeners
      vapiInstance.on("call-start", () => {
        console.log("Call started");
        setIsCallActive(true);
        setStatus("ai-speaking");
      });

      vapiInstance.on("call-end", () => {
        console.log("Call ended");
        setIsCallActive(false);
        setStatus("idle");
        setIsSpeaking(false);
        setIsListening(false);
      });

      vapiInstance.on("speech-start", () => {
        console.log("Speech started");
        setIsSpeaking(true);
        setStatus("ai-speaking");
      });

      vapiInstance.on("speech-end", () => {
        console.log("Speech ended");
        setIsSpeaking(false);
        setStatus("user-speaking");
      });

      vapiInstance.on("message", (message: any) => {
        console.log("Message received:", message);
        if (message.type === "transcript" && message.transcript) {
          const transcript: TranscriptMessage = {
            role: message.role === "assistant" ? "assistant" : "user",
            text: message.transcript,
            timestamp: new Date(),
          };
          setTranscripts((prev) => [...prev, transcript]);
        }
      });

      vapiInstance.on("error", (error: any) => {
        console.error("Vapi error:", error);
        setStatus("idle");
        setIsCallActive(false);
      });

      return () => {
        vapiInstance.stop();
      };
    } catch (error) {
      console.error("Failed to initialize Vapi:", error);
    }
  }, [vapiApiKey]);

  const startInterview = useCallback(async () => {
    if (!vapi) return;

    setStatus("connecting");
    
    try {
      // Start call with assistant ID or configuration
      // Option 1: Using assistant ID (recommended - create assistant in Vapi dashboard)
      // await vapi.start("your-assistant-id");
      
      // Option 2: Using transient assistant configuration
      const systemPrompt = `You are a professional and friendly AI interviewer conducting a ${jobRole.title} interview. 

Role Context:
- Position: ${jobRole.title}
- Category: ${jobRole.category}
- Key Skills: ${jobRole.skills.join(', ')}

Your responsibilities:
1. Ask relevant questions specific to ${jobRole.title} role
2. Assess technical knowledge in: ${jobRole.skills.slice(0, 3).join(', ')}
3. Evaluate problem-solving abilities related to ${jobRole.description}
4. Be conversational, encouraging, and provide constructive feedback
5. Ask follow-up questions based on candidate responses
6. Cover both technical skills and behavioral aspects

Conduct a thorough but friendly interview focusing on the candidate's experience and expertise in ${jobRole.title}.`;

      await vapi.start({
        transcriber: {
          provider: "deepgram",
          model: "nova-2",
          language: "en",
        },
        model: {
          provider: "openai",
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
          ],
        },
        voice: {
          provider: "11labs",
          voiceId: "21m00Tcm4TlvDq8ikWAM",
        },
        name: `IntervU ${jobRole.title} Interviewer`,
        firstMessage: `Hello! Welcome to your ${jobRole.title} interview with IntervU. I'm excited to learn about your experience in ${jobRole.category}. Let's start - can you tell me about your background and why you're interested in ${jobRole.title} positions?`,
      });
    } catch (error) {
      console.error("Failed to start interview:", error);
      setStatus("idle");
    }
  }, [vapi]);

  const endInterview = useCallback(() => {
    if (!vapi) return;
    vapi.stop();
    setTranscripts([]);
  }, [vapi]);

  const toggleInterview = useCallback(() => {
    if (isCallActive) {
      endInterview();
    } else {
      startInterview();
    }
  }, [isCallActive, startInterview, endInterview]);

  return (
    <div className="grid h-screen grid-cols-1 gap-6 p-6 lg:grid-cols-3">
      {/* Main Interview Area (2/3 width on large screens) */}
      <div className="flex flex-col items-center justify-center lg:col-span-2">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-3 bg-gradient-to-r from-accent-purple to-accent-blue bg-clip-text text-5xl font-bold text-transparent">
            IntervU
          </h1>
          <p className="text-lg text-white/60">
            Your AI-Powered Interview Partner
          </p>
        </div>

        {/* Status Indicator */}
        <div className="mb-8">
          <StatusIndicator status={status} />
        </div>

        {/* Voice Visualizer */}
        <div className="mb-8">
          <VoiceVisualizer
            isActive={isCallActive}
            isSpeaking={isSpeaking}
            isListening={isListening}
            onClick={toggleInterview}
          />
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-white/50">
            {isCallActive ? "Click to end interview" : "Click to start interview"}
          </p>
          
          {isCallActive && (
            <button
              onClick={endInterview}
              className="flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-6 py-2 text-sm font-medium text-red-400 transition-colors hover:border-red-500/50 hover:bg-red-500/20"
            >
              <PhoneOff className="h-4 w-4" />
              End Interview
            </button>
          )}
        </div>
      </div>

      {/* Transcript Panel (1/3 width on large screens) */}
      <div className="lg:col-span-1">
        <TranscriptPanel messages={transcripts} />
      </div>
    </div>
  );
}
