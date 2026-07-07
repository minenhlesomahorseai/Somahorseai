import { NextResponse } from "next/server";

import { aiConfigured, streamChat, type ChatMessage } from "@/lib/ai/provider";
import { intakeSystemPrompt } from "@/lib/ai/agents";
import { getClientContextForApi } from "@/lib/dashboard/session";

export const runtime = "nodejs";

interface IntakeBody {
  messages?: ChatMessage[];
}

export async function POST(request: Request) {
  const context = await getClientContextForApi();
  if (!context) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!aiConfigured()) {
    return NextResponse.json(
      { error: "AI is not configured. Add GEMINI_API_KEY or OPENAI_API_KEY." },
      { status: 503 }
    );
  }

  let body: IntakeBody;
  try {
    body = (await request.json()) as IntakeBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const history = (body.messages ?? []).filter(
    (m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string"
  );

  // Gemini/OpenAI need at least one user turn; on first open we inject a trigger
  // so the agent greets the client proactively.
  const messages: ChatMessage[] =
    history.length === 0
      ? [
          {
            role: "user",
            content:
              "(The client just opened the new-project chat. Greet them by name and invite them to describe their problem.)",
          },
        ]
      : history;

  try {
    const stream = await streamChat({
      system: intakeSystemPrompt(context),
      messages,
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
