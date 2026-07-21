import { NextResponse } from "next/server";

import { completeGeminiJson } from "@/lib/ai/gemini-json";
import { aiConfigured } from "@/lib/ai/provider";
import {
  matchingSystemPrompt,
  matchingUserPrompt,
  type MatchResult,
} from "@/lib/ai/agents";
import { fetchAvailableDevelopers } from "@/lib/dashboard/data";
import { getClientContextForApi } from "@/lib/dashboard/session";
import type { AvailableDeveloper } from "@/lib/dashboard/types";
import type { ProjectProposal, ProposedTeamMember } from "@/lib/projects/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface MatchBody {
  conversationId?: string;
}

const MATCH_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  properties: {
    rationale: { type: "string" },
    team: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          role: { type: "string" },
          matchScore: { type: "integer", minimum: 0, maximum: 100 },
          reason: { type: "string" },
        },
        required: ["id", "name", "role", "matchScore", "reason"],
      },
    },
  },
  required: ["rationale", "team"],
};

function deterministicMatch(
  proposal: ProjectProposal,
  developers: AvailableDeveloper[]
): MatchResult {
  const roles = (proposal.requiredRoles?.length
    ? proposal.requiredRoles
    : ["Project engineer"]
  ).slice(0, Math.min(4, developers.length));
  const remaining = [...developers];
  const projectWords = `${proposal.solutionType} ${proposal.approach} ${proposal.components.join(" ")}`
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length > 2);

  const team = roles.map((role) => {
    const roleWords = role.toLowerCase().split(/\W+/).filter((word) => word.length > 2);
    const ranked = remaining
      .map((developer) => {
        const candidateText = [
          developer.primary_role,
          developer.headline,
          developer.agri_experience,
          ...developer.skills,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        const overlap = [...projectWords, ...roleWords].filter((word) =>
          candidateText.includes(word)
        ).length;
        return {
          developer,
          score: Math.min(
            94,
            72 + overlap * 3 + Math.min(8, developer.years_experience ?? 0)
          ),
        };
      })
      .sort((left, right) => right.score - left.score);
    const selected = ranked[0];
    remaining.splice(
      remaining.findIndex((developer) => developer.id === selected.developer.id),
      1
    );
    return {
      id: selected.developer.id,
      name: selected.developer.full_name ?? "Certified Somahorse specialist",
      role,
      matchScore: selected.score,
      reason: `Certified and currently available, with the strongest recorded fit for the ${role.toLowerCase()} responsibilities.`,
    };
  });

  return {
    rationale:
      "The team was selected from certified, currently unallocated specialists using role, skill, seniority, and agricultural-context fit.",
    team,
  };
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

  if (!body.conversationId) {
    return NextResponse.json({ error: "Missing intake conversation" }, { status: 400 });
  }

  const supabase = await createClient();
  const writer = createAdminClient();
  if (!writer) {
    return NextResponse.json({ error: "Project matching storage is not configured." }, { status: 503 });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: conversation, error: conversationError } = await supabase
    .from("intake_conversations")
    .select("id, stage, proposal, project_id")
    .eq("id", body.conversationId)
    .eq("client_id", user.id)
    .maybeSingle();

  if (conversationError) {
    return NextResponse.json({ error: "Could not load the saved proposal." }, { status: 500 });
  }
  if (!conversation || conversation.stage !== "proposal_ready" || !conversation.proposal) {
    return NextResponse.json(
      { error: "Finish the intake before assembling a team." },
      { status: 409 }
    );
  }
  if (conversation.project_id) {
    return NextResponse.json({ error: "This project has already been prepared." }, { status: 409 });
  }

  const developers = await fetchAvailableDevelopers(supabase);
  const proposal = conversation.proposal as ProjectProposal;

  if (developers.length === 0) {
    const emptyResult = {
      rationale:
        "No certified specialists are unallocated right now. Your scope is saved and Somahorse.ai will complete staffing before work begins.",
      team: [] as ProposedTeamMember[],
      poolSize: 0,
    };
    await writer
      .from("intake_conversations")
      .update({ proposed_team: [], match_rationale: emptyResult.rationale })
      .eq("id", conversation.id)
      .eq("client_id", user.id);
    return NextResponse.json(emptyResult);
  }

  const fallback = deterministicMatch(proposal, developers);
  let raw = fallback;
  if (aiConfigured()) {
    try {
      raw = await completeGeminiJson<MatchResult>({
        system: matchingSystemPrompt(),
        user: matchingUserPrompt(JSON.stringify(proposal), developers),
        temperature: 0.2,
        responseJsonSchema: MATCH_SCHEMA,
        model: process.env.GEMINI_INTAKE_MODEL ?? "gemini-3.5-flash-lite",
        maxOutputTokens: 1_500,
        timeoutMs: 25_000,
        attempts: 1,
      });
    } catch (error) {
      console.warn("Gemini matching fell back to deterministic matching", error);
    }
  }

  try {
    const availableById = new Map(developers.map((developer) => [developer.id, developer]));
    const seen = new Set<string>();
    let team: ProposedTeamMember[] = (Array.isArray(raw.team) ? raw.team : [])
      .filter((member) => availableById.has(member.id) && !seen.has(member.id))
      .map((member) => {
        seen.add(member.id);
        const developer = availableById.get(member.id)!;
        return {
          id: member.id,
          name: developer.full_name ?? "Certified Somahorse specialist",
          role: String(member.role || developer.primary_role || "Project engineer").slice(0, 120),
          matchScore: Math.max(0, Math.min(100, Math.round(Number(member.matchScore) || 0))),
          reason: String(member.reason || "Strong fit for the proposed scope.").slice(0, 400),
        };
      })
      .slice(0, 4);
    if (!team.length) {
      team = fallback.team;
    }

    const result = {
      rationale:
        typeof raw.rationale === "string" && raw.rationale.trim()
          ? raw.rationale.trim()
          : "The team was selected from certified, currently unallocated specialists.",
      team,
      poolSize: developers.length,
    };

    const { error: saveError } = await writer
      .from("intake_conversations")
      .update({ proposed_team: team, match_rationale: result.rationale })
      .eq("id", conversation.id)
      .eq("client_id", user.id);
    if (saveError) throw new Error(saveError.message);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Matching failed", error);
    return NextResponse.json(
      { error: "The matching agent could not finish the team. Please try again." },
      { status: 502 }
    );
  }
}
