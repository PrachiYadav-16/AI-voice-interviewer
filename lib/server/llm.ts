import "server-only";

/**
 * Minimal OpenAI-compatible chat client for planning and evaluation.
 * Works with OpenAI and any provider exposing /chat/completions (set LLM_BASE_URL).
 * Prompts and responses are never logged.
 */

export class LlmNotConfiguredError extends Error {
  constructor() {
    super("LLM_API_KEY is not set");
    this.name = "LlmNotConfiguredError";
  }
}

export class LlmError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "LlmError";
  }
}

export function llmConfigured(): boolean {
  return Boolean(process.env.LLM_API_KEY);
}

interface ChatOptions {
  system: string;
  user: string;
  maxTokens?: number;
  timeoutMs?: number;
  temperature?: number;
}

export async function chatJson(opts: ChatOptions): Promise<unknown> {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) throw new LlmNotConfiguredError();
  const baseUrl = (process.env.LLM_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.LLM_MODEL || "gpt-4.1-mini";

  const body = JSON.stringify({
    model,
    temperature: opts.temperature ?? 0.2,
    max_tokens: opts.maxTokens ?? 4000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
  });

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 60_000);
    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body,
        signal: controller.signal,
      });
      if (res.status === 429 || res.status >= 500) {
        lastError = new LlmError(`Provider returned ${res.status}`, res.status);
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      if (!res.ok) throw new LlmError(`Provider returned ${res.status}`, res.status);
      const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new LlmError("Empty response from provider");
      try {
        return JSON.parse(content);
      } catch {
        throw new LlmError("Provider returned invalid JSON");
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") lastError = new LlmError("Provider timed out");
      else if (err instanceof LlmError && err.status && err.status < 500 && err.status !== 429) throw err;
      else lastError = err;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError instanceof Error ? lastError : new LlmError("Provider request failed");
}
