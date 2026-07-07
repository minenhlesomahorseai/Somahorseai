"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export interface CreateProjectInput {
  title: string;
  summary: string;
  scope: string;
  sector: string | null;
  budget_range: string | null;
  timeline: string | null;
  matched_team: string[];
}

export interface CreateProjectResult {
  ok: boolean;
  error?: string;
}

export async function createProject(
  input: CreateProjectInput
): Promise<CreateProjectResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Not authenticated" };
  }

  const { error } = await supabase.from("projects").insert({
    client_id: user.id,
    title: input.title.slice(0, 160),
    summary: input.summary.slice(0, 500),
    scope: input.scope,
    sector: input.sector,
    budget_range: input.budget_range,
    timeline: input.timeline,
    matched_team: input.matched_team,
    status: input.matched_team.length > 0 ? "matching" : "scoping",
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/client/projects");
  revalidatePath("/dashboard/client");
  return { ok: true };
}
