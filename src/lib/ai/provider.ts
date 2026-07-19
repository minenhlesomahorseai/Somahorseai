/**
 * Lightweight Gemini chat layer for the Somahorse.ai agents.
 *
 * We talk to Gemini directly over its REST API so no extra SDK
 * dependency is needed. Both a streaming and a non-streaming helper are exposed.
 */

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

function geminiKey(): string | undefined {
  return process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;
}

export function aiConfigured(): boolean {
  return Boolean(geminiKey());
}

interface CallOptions {
  system: string;
  messages: ChatMessage[];
  temperature?: number;
}

/** Stream assistant text as a ReadableStream of UTF-8 encoded chunks. */
export async function streamChat({
  system,
  messages,
  temperature = 0.6,
}: CallOptions): Promise<ReadableStream<Uint8Array>> {
  if (!geminiKey()) {
    throw new Error("No AI provider configured — add GEMINI_API_KEY.");
  }
  return streamGemini({ system, messages, temperature });
}

/** One-shot completion returning the full assistant text. */
export async function completeChat(options: CallOptions): Promise<string> {
  const stream = await streamChat(options);
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let out = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    out += decoder.decode(value, { stream: true });
  }
  out += decoder.decode();
  return out;
}

// ---------------------------------------------------------------------------
// Gemini
// ---------------------------------------------------------------------------
async function streamGemini({
  system,
  messages,
  temperature,
}: CallOptions): Promise<ReadableStream<Uint8Array>> {
  const key = geminiKey()!;
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        generationConfig: { temperature },
      }),
    }
  );

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Gemini request failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  return sseToText(res.body, extractGeminiText);
}

interface GeminiChunk {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

function extractGeminiText(json: unknown): string {
  const parts = (json as GeminiChunk)?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts.map((p) => p.text ?? "").join("");
}

// ---------------------------------------------------------------------------
// Shared SSE -> plain-text transform
// ---------------------------------------------------------------------------
function sseToText(
  body: ReadableStream<Uint8Array>,
  extract: (json: unknown) => string
): ReadableStream<Uint8Array> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { value, done } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        try {
          const json: unknown = JSON.parse(data);
          const text = extract(json);
          if (text) controller.enqueue(encoder.encode(text));
        } catch {
          // Ignore partial / keep-alive frames.
        }
      }
    },
    cancel() {
      reader.cancel().catch(() => {});
    },
  });
}
