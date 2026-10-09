import { NextResponse } from "next/server";
import { llmConfigured } from "@/lib/server/llm";

export const dynamic = "force-dynamic";

/** Reports which services are configured (booleans only, never values). */
export function GET() {
  return NextResponse.json({
    voice: Boolean(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY),
    ai: llmConfigured(),
  });
}
