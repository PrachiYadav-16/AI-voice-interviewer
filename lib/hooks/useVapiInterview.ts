"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type Vapi from "@vapi-ai/web";
import type { CreateAssistantDTO } from "@vapi-ai/web/dist/api";
import { CONTROL } from "@/lib/interview/prompt";
import {
  initialLiveState,
  liveReducer,
  vapiRoleToSpeaker,
  type ErrorKind,
} from "@/lib/interview/session";

const CONNECT_TIMEOUT_MS = 25_000;
const STOP_FALLBACK_MS = 4_000;

interface Options {
  publicKey: string | undefined;
}

/** Turns a Vapi/Daily error payload into something we can show without leaking internals. */
function classifyError(err: unknown): { kind: ErrorKind; message: string } {
  const raw = (() => {
    try {
      return typeof err === "string" ? err : JSON.stringify(err);
    } catch {
      return String(err);
    }
  })().toLowerCase();

  if (raw.includes("401") || raw.includes("403") || raw.includes("invalid key") || raw.includes("unauthorized")) {
    return { kind: "config", message: "The voice service rejected the app's key. The site owner needs to check the Vapi public key." };
  }
  if (raw.includes("credit") || raw.includes("billing") || raw.includes("payment")) {
    return { kind: "config", message: "The voice service account has no available credit. The site owner needs to top it up." };
  }
  if (raw.includes("network") || raw.includes("ice") || raw.includes("websocket") || raw.includes("connection")) {
    return { kind: "network", message: "The connection to the voice service dropped. Check your internet connection and try again." };
  }
  if (raw.includes("ejected") || raw.includes("meeting has ended")) {
    return { kind: "network", message: "The voice session was closed by the server." };
  }
  return { kind: "unknown", message: "Something went wrong with the voice session. Try again in a moment." };
}

function sendSystem(v: Vapi | null, content: string, trigger: boolean) {
  v?.send({ type: "add-message", message: { role: "system", content }, triggerResponseEnabled: trigger });
}

export function useVapiInterview({ publicKey }: Options) {
  const [state, dispatch] = useReducer(liveReducer, initialLiveState);
  const vapiRef = useRef<Vapi | null>(null);
  const userMutedRef = useRef(false);
  const connectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [interviewerLevel, setInterviewerLevel] = useState(0);
  const [micLevel, setMicLevel] = useState(0);

  const clearTimers = () => {
    if (connectTimer.current) clearTimeout(connectTimer.current);
    if (stopTimer.current) clearTimeout(stopTimer.current);
    connectTimer.current = null;
    stopTimer.current = null;
  };

  // Tear down on unmount: remove listeners first so teardown events can't update unmounted state.
  useEffect(() => {
    return () => {
      clearTimers();
      const v = vapiRef.current;
      vapiRef.current = null;
      if (v) {
        v.removeAllListeners();
        v.stop().catch(() => {});
      }
    };
  }, []);

  const attach = useCallback((v: Vapi) => {
    let seq = 0;
    v.on("call-start", () => {
      if (connectTimer.current) clearTimeout(connectTimer.current);
      dispatch({ type: "call-started", at: Date.now() });
    });
    v.on("call-start-failed", (e) => {
      clearTimers();
      dispatch({ type: "error", ...classifyError(e.error) });
    });
    v.on("call-end", () => {
      clearTimers();
      setInterviewerLevel(0);
      setMicLevel(0);
      dispatch({ type: "call-ended", at: Date.now() });
    });
    v.on("volume-level", (level) => setInterviewerLevel(level));
    v.on("local-volume-level", (level) => setMicLevel(level));
    v.on("message", (msg: unknown) => {
      if (!msg || typeof msg !== "object") return;
      const m = msg as Record<string, unknown>;
      if (m.type === "transcript") {
        const speaker = vapiRoleToSpeaker(m.role);
        if (!speaker || typeof m.transcript !== "string") return;
        dispatch({
          type: "transcript",
          speaker,
          final: m.transcriptType === "final",
          text: m.transcript,
          at: Date.now(),
          id: `t${Date.now()}-${seq++}`,
        });
      } else if (m.type === "speech-update") {
        const speaker = vapiRoleToSpeaker(m.role);
        if (speaker && (m.status === "started" || m.status === "stopped")) {
          dispatch({ type: "speech", speaker, status: m.status });
        }
      } else if (m.type === "status-update" && m.status === "ended") {
        dispatch({ type: "call-ended", at: Date.now(), reason: typeof m.endedReason === "string" ? m.endedReason : undefined });
      }
    });
    v.on("error", (e) => {
      clearTimers();
      dispatch({ type: "error", ...classifyError(e) });
      v.stop().catch(() => {});
    });
  }, []);

  const start = useCallback(
    async (assistant: CreateAssistantDTO) => {
      if (!publicKey) {
        dispatch({ type: "error", kind: "config", message: "Voice is not configured on this site. Add NEXT_PUBLIC_VAPI_PUBLIC_KEY." });
        return;
      }
      dispatch({ type: "start" });

      // 1. Microphone permission, checked up front so we can explain failures clearly.
      if (!navigator.mediaDevices?.getUserMedia) {
        dispatch({ type: "mic-error", kind: "mic-missing", message: "This browser can't access a microphone. Use a recent Chrome, Edge, Firefox or Safari over HTTPS." });
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Release immediately; the voice SDK opens its own stream.
        stream.getTracks().forEach((t) => t.stop());
      } catch (err) {
        const name = (err as DOMException)?.name;
        if (name === "NotFoundError" || name === "OverconstrainedError") {
          dispatch({ type: "mic-error", kind: "mic-missing", message: "No microphone was found. Connect one and try again." });
        } else {
          dispatch({
            type: "mic-error",
            kind: "mic-denied",
            message: "Microphone access is blocked. Allow it from the icon in your browser's address bar, then try again.",
          });
        }
        return;
      }
      dispatch({ type: "mic-granted" });

      // 2. Fresh SDK instance per call avoids stale listeners from a previous attempt.
      const { default: VapiCtor } = await import("@vapi-ai/web");
      const previous = vapiRef.current;
      if (previous) {
        previous.removeAllListeners();
        await previous.stop().catch(() => {});
      }
      const v = new VapiCtor(publicKey);
      vapiRef.current = v;
      userMutedRef.current = false;
      attach(v);

      connectTimer.current = setTimeout(() => {
        dispatch({ type: "error", kind: "connect", message: "Connecting took too long. Check your connection and try again." });
        v.stop().catch(() => {});
      }, CONNECT_TIMEOUT_MS);

      try {
        const call = await v.start(assistant);
        if (!call && vapiRef.current === v) {
          // start() resolves null when it fails; the error event usually explains why.
          clearTimers();
          dispatch({ type: "error", kind: "connect", message: "The voice session could not be started. Try again in a moment." });
        }
      } catch (err) {
        clearTimers();
        dispatch({ type: "error", ...classifyError(err) });
      }
    },
    [attach, publicKey],
  );

  const setMuted = useCallback((muted: boolean) => {
    userMutedRef.current = muted;
    vapiRef.current?.setMuted(muted);
    dispatch({ type: "set-muted", muted });
  }, []);

  const pause = useCallback(() => {
    const v = vapiRef.current;
    if (!v) return;
    v.setMuted(true);
    v.send({ type: "control", control: "mute-assistant" });
    sendSystem(v, CONTROL.pause, false);
    dispatch({ type: "pause" });
  }, []);

  const resume = useCallback(() => {
    const v = vapiRef.current;
    if (!v) return;
    v.setMuted(userMutedRef.current);
    v.send({ type: "control", control: "unmute-assistant" });
    sendSystem(v, CONTROL.resume, true);
    dispatch({ type: "resume" });
  }, []);

  const skip = useCallback(() => sendSystem(vapiRef.current, CONTROL.skip, true), []);
  const repeat = useCallback(() => sendSystem(vapiRef.current, CONTROL.repeat, true), []);
  const wrapUp = useCallback(() => sendSystem(vapiRef.current, CONTROL.wrapUp, true), []);

  const end = useCallback(() => {
    const v = vapiRef.current;
    dispatch({ type: "end-requested" });
    if (!v) {
      dispatch({ type: "call-ended", at: Date.now(), reason: "ended-by-candidate" });
      return;
    }
    v.stop().catch(() => {});
    // If call-end never arrives (e.g. network already gone), finish locally.
    stopTimer.current = setTimeout(() => {
      v.removeAllListeners();
      dispatch({ type: "call-ended", at: Date.now(), reason: "ended-by-candidate" });
    }, STOP_FALLBACK_MS);
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    dispatch({ type: "reset" });
  }, []);

  return { state, interviewerLevel, micLevel, start, setMuted, pause, resume, skip, repeat, wrapUp, end, reset };
}
