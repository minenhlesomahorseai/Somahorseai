import { NextResponse } from "next/server";

import { aiConfigured, completeChat } from "@/lib/ai/provider";
import {
  matchingSystemPrompt,
  matchingUserPrompt,
  type MatchResult,
} from "@/lib/ai/agents";
import { fetchAvailableDevelopers } from "@/lib/dashboard/data";
import { getClientContextForApi } from "@/lib/dashboard/session";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface MatchBody {
  scope?: string;
}

function parseMatchResult(raw: string): MatchResult | null {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as MatchResult;
    if (!Array.isArray(parsed.team)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const context = await getClientContextForApi();
  if (!context) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: MatchBody;
  try {
    body = (await request.json()) as MatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const scope = (body.scope ?? "").trim();
  if (!scope) {
    return NextResponse.json({ error: "Missing project scope" }, { status: 400 });
  }

  const supabase = await createClient();
  const developers = await fetchAvailableDevelopers(supabase);

  if (developers.length === 0) {
    return NextResponse.json({
      rationale:
        "No certified developers are available in the network yet. As talent is approved through certification, your matched team will appear here.",
      team: [],
      poolSize: 0,
    });
  }

  if (!aiConfigured()) {
    return NextResponse.json(
      { error: "AI is not configured. Add GEMINI_API_KEY." },
      { status: 503 }
    );
  }

  try {
    const raw = await completeChat({
      system: matchingSystemPrompt(),
      messages: [{ role: "user", content: matchingUserPrompt(scope, developers) }],
      temperature: 0.2,
    });
    const result = parseMatchResult(raw);
    if (!result) {
      return NextResponse.json(
        { error: "Could not assemble a team. Please try again." },
        { status: 502 }
      );
    }
    return NextResponse.json({ ...result, poolSize: developers.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Matching failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
