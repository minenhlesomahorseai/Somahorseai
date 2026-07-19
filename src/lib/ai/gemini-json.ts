/**
 * Direct, non-streaming Gemini JSON completion. Used by the assessment
 * pipeline for strict JSON responses.
 */

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3-flash-preview";

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
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

/** Calls Gemini in JSON mode and returns the parsed object of type T. */
export async function completeGeminiJson<T>({
  system,
  user,
  temperature = 0.7,
}: GeminiJsonOptions): Promise<T> {
  const key = geminiKey();
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: {
          temperature,
          responseMimeType: "application/json",
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

  try {
    return JSON.parse(content) as T;
  } catch {
    throw new Error("Gemini returned invalid JSON");
  }
}
