/**
 * Direct, non-streaming Gemini JSON completion. Used by the assessment
 * pipeline for strict JSON responses.
 */

const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";

function geminiKey(): string | undefined {
  return process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;
}

export function geminiJsonConfigured(): boolean {
  return Boolean(geminiKey());
}

interface GeminiJsonOptions {
  system: string;
  user: string;
  temperature?: number;
  responseJsonSchema?: Record<string, unknown>;
  model?: string;
  maxOutputTokens?: number;
  timeoutMs?: number;
  attempts?: number;
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

/** Calls Gemini in JSON mode and returns the parsed object of type T. */
export async function completeGeminiJson<T>({
  system,
  user,
  temperature = 0.7,
  responseJsonSchema,
  model = DEFAULT_GEMINI_MODEL,
  maxOutputTokens,
  timeoutMs = 60_000,
  attempts = 2,
}: GeminiJsonOptions): Promise<T> {
  const key = geminiKey();
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(timeoutMs),
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: "user", parts: [{ text: user }] }],
            generationConfig: {
              temperature,
              ...(maxOutputTokens ? { maxOutputTokens } : {}),
              responseMimeType: "application/json",
              ...(responseJsonSchema ? { responseJsonSchema } : {}),
            },
          }),
        }
      );

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(`Gemini request failed (${res.status}): ${detail.slice(0, 300)}`);
      }

      const json = (await res.json()) as GeminiResponse;
      const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        throw new Error("Gemini returned an empty response");
      }

      const cleaned = content
        .trim()
        .replace(/^```(?:json)?/i, "")
        .replace(/```$/i, "")
        .trim();
      return JSON.parse(cleaned) as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Gemini JSON request failed");
    }
  }

  throw lastError ?? new Error("Gemini returned invalid JSON");
}
