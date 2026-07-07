/**
 * Direct, non-streaming OpenAI JSON completion. Used by the assessment
 * pipeline, which must use OpenAI specifically (not the Gemini-preferring
 * shared provider) and needs strict JSON back.
 */

const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

export function openaiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

interface OpenAiJsonOptions {
  system: string;
  user: string;
  temperature?: number;
}

interface OpenAiResponse {
  choices?: { message?: { content?: string } }[];
}

/** Calls OpenAI in JSON mode and returns the parsed object of type T. */
export async function completeOpenAiJson<T>({
  system,
  user,
  temperature = 0.7,
}: OpenAiJsonOptions): Promise<T> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenAI request failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  const json = (await res.json()) as OpenAiResponse;
  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned an empty response");
  }

  try {
    return JSON.parse(content) as T;
  } catch {
    throw new Error("OpenAI returned invalid JSON");
  }
}
