/**
 * Lightweight multi-provider chat layer for the Somahorse.ai agents.
 *
 * We talk to Gemini and OpenAI directly over their REST APIs so no extra SDK
 * dependency is needed. Gemini is preferred when a key is present, otherwise we
 * fall back to OpenAI. Both a streaming and a non-streaming helper are exposed.
 */

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export type AiProvider = "gemini" | "openai";

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

function geminiKey(): string | undefined {
  return process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;
}

function openaiKey(): string | undefined {
  return process.env.OPENAI_API_KEY;
}

export function resolveProvider(): AiProvider | null {
  if (geminiKey()) return "gemini";
  if (openaiKey()) return "openai";
  return null;
}

export function aiConfigured(): boolean {
  return resolveProvider() !== null;
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
  const provider = resolveProvider();
  if (!provider) {
    throw new Error("No AI provider configured");
  }
  return provider === "gemini"
    ? streamGemini({ system, messages, temperature })
    : streamOpenAi({ system, messages, temperature });
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
// OpenAI
// ---------------------------------------------------------------------------
async function streamOpenAi({
  system,
  messages,
  temperature,
}: CallOptions): Promise<ReadableStream<Uint8Array>> {
  const key = openaiKey()!;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature,
      stream: true,
      messages: [{ role: "system", content: system }, ...messages],
    }),
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenAI request failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  return sseToText(res.body, extractOpenAiText);
}

interface OpenAiChunk {
  choices?: { delta?: { content?: string } }[];
}

function extractOpenAiText(json: unknown): string {
  return (json as OpenAiChunk)?.choices?.[0]?.delta?.content ?? "";
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
