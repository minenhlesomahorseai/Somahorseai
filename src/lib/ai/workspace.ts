import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { completeGeminiJson, geminiJsonConfigured } from "@/lib/ai/gemini-json";
import type { ProjectProposal } from "@/lib/projects/types";

interface GeneratedTask {
  title: string;
  description: string;
  ownerRole: string;
}

interface GeneratedMilestone {
  title: string;
  description: string;
  durationDays: number;
  tasks: GeneratedTask[];
}

interface GeneratedWorkspacePlan {
  milestones: GeneratedMilestone[];
}

interface WorkspaceProjectRow {
  id: string;
  title: string;
  summary: string | null;
  problem: string | null;
  proposed_solution: string | null;
  scope: string | null;
  proposal: ProjectProposal | null;
  timeline_weeks: number | null;
  build_fee_amount: number | null;
  deposit_amount: number | null;
  started_at: string | null;
}

interface WorkspaceAssignmentRow {
  talent_id: string;
  role: string;
  status: string;
}

const WORKSPACE_SCHEMA = {
  type: "object",
  properties: {
    milestones: {
      type: "array",
      minItems: 3,
      maxItems: 7,
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          durationDays: { type: "integer", minimum: 1, maximum: 60 },
          tasks: {
            type: "array",
            minItems: 2,
            maxItems: 6,
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                ownerRole: { type: "string" },
              },
              required: ["title", "description", "ownerRole"],
            },
          },
        },
        required: ["title", "description", "durationDays", "tasks"],
      },
    },
  },
  required: ["milestones"],
} as const;

/**
 * Idempotently provisions the shared delivery workspace. Gemini provides the
 * implementation checklist when configured; the accepted proposal is the
 * deterministic fallback so payment activation can never be blocked by AI.
 */
export async function ensureProjectWorkspace(
  admin: SupabaseClient,
  projectId: string
): Promise<{ generated: boolean; source: "ai" | "proposal" | "fallback" }>
{
  const { count } = await admin
    .from("project_milestones")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);
  if ((count ?? 0) > 0) return { generated: false, source: "fallback" };

  const [{ data: rawProject, error: projectError }, { data: rawAssignments }] = await Promise.all([
    admin
      .from("projects")
      .select(
        "id, title, summary, problem, proposed_solution, scope, proposal, timeline_weeks, build_fee_amount, deposit_amount, started_at"
      )
      .eq("id", projectId)
      .maybeSingle(),
    admin
      .from("project_assignments")
      .select("talent_id, role, status")
      .eq("project_id", projectId)
      .in("status", ["assigned", "active"]),
  ]);
  if (projectError || !rawProject) throw new Error("Project could not be loaded for workspace generation");

  const project = rawProject as WorkspaceProjectRow;
  const assignments = (rawAssignments ?? []) as unknown as WorkspaceAssignmentRow[];
  let source: "ai" | "proposal" | "fallback" = "fallback";
  let milestones: GeneratedMilestone[];

  if (geminiJsonConfigured()) {
    try {
      const result = await completeGeminiJson<GeneratedWorkspacePlan>({
        system: `You are Somahorse.ai's Project Management Agent. Turn a funded agricultural technology project into a practical delivery plan for a shared developer workspace. Create 3-7 sequential milestones and 2-6 concrete, verifiable tasks per milestone. Tasks must be implementation work that a team member can truthfully mark complete. Do not include payments, meetings, vague status updates, or work outside the supplied scope. Use the supplied team roles exactly where possible. Return strict JSON only.`,
        user: JSON.stringify({
          project: {
            title: project.title,
            summary: project.summary,
            problem: project.problem,
            solution: project.proposed_solution,
            scope: project.scope,
            proposal: project.proposal,
            timelineWeeks: project.timeline_weeks,
          },
          assignedTeam: assignments.map((item) => ({
            role: item.role,
            name: "Certified specialist",
          })),
        }),
        temperature: 0.35,
        responseJsonSchema: WORKSPACE_SCHEMA,
        maxOutputTokens: 5000,
        timeoutMs: 35_000,
      });
      milestones = normalizePlan(result);
      if (milestones.length >= 3) source = "ai";
      else milestones = fallbackPlan(project);
    } catch (error) {
      console.error("AI workspace generation fell back to the accepted proposal", error);
      milestones = fallbackPlan(project);
    }
  } else {
    milestones = fallbackPlan(project);
  }

  if (source !== "ai") {
    source = project.proposal?.milestones?.length ? "proposal" : "fallback";
  }

  const expectedCompletion = new Date(
    new Date(project.started_at ?? Date.now()).getTime() + (project.timeline_weeks ?? 8) * 7 * 86_400_000
  ).toISOString();
  const { error: workspaceError } = await admin.from("project_workspaces").upsert(
    {
      project_id: projectId,
      status: "active",
      generated_by: source,
      expected_completion_at: expectedCompletion,
      generated_at: new Date().toISOString(),
    },
    { onConflict: "project_id" }
  );
  if (workspaceError) throw new Error(workspaceError.message);

  const remainingBuildFee = Math.max(
    0,
    Number(project.build_fee_amount ?? 0) - Number(project.deposit_amount ?? 0)
  );
  const paymentAmounts = splitAmount(remainingBuildFee, milestones.length);

  for (let milestoneIndex = 0; milestoneIndex < milestones.length; milestoneIndex += 1) {
    const milestone = milestones[milestoneIndex];
    const { data: storedMilestone, error: milestoneError } = await admin
      .from("project_milestones")
      .upsert(
        {
          project_id: projectId,
          title: milestone.title,
          description: milestone.description,
          sequence: milestoneIndex + 1,
          duration_days: milestone.durationDays,
          payment_amount: paymentAmounts[milestoneIndex],
          payment_status: paymentAmounts[milestoneIndex] > 0 ? "not_due" : "waived",
        },
        { onConflict: "project_id,sequence" }
      )
      .select("id")
      .single();
    if (milestoneError || !storedMilestone) throw new Error(milestoneError?.message ?? "Milestone could not be stored");

    const tasks = milestone.tasks.map((task, taskIndex) => ({
      project_id: projectId,
      milestone_id: storedMilestone.id,
      title: task.title,
      description: task.description,
      sequence: taskIndex + 1,
      assigned_talent_id: matchTalentForRole(task.ownerRole, assignments),
    }));
    if (tasks.length) {
      const { error: tasksError } = await admin
        .from("project_tasks")
        .upsert(tasks, { onConflict: "milestone_id,sequence" });
      if (tasksError) throw new Error(tasksError.message);
    }
  }

  return { generated: true, source };
}

function normalizePlan(plan: GeneratedWorkspacePlan): GeneratedMilestone[] {
  if (!Array.isArray(plan?.milestones)) return [];
  return plan.milestones.slice(0, 7).map((milestone, index) => ({
    title: clean(milestone.title, `Milestone ${index + 1}`, 180),
    description: clean(milestone.description, "Complete the planned delivery phase.", 800),
    durationDays: clamp(Math.round(Number(milestone.durationDays) || 7), 1, 60),
    tasks: Array.isArray(milestone.tasks)
      ? milestone.tasks.slice(0, 6).map((task, taskIndex) => ({
          title: clean(task.title, `Delivery task ${taskIndex + 1}`, 220),
          description: clean(task.description, "Complete and verify this implementation task.", 800),
          ownerRole: clean(task.ownerRole, "Shared team", 160),
        }))
      : [],
  })).filter((milestone) => milestone.tasks.length >= 2);
}

function fallbackPlan(project: WorkspaceProjectRow): GeneratedMilestone[] {
  const proposalMilestones = project.proposal?.milestones ?? [];
  if (proposalMilestones.length) {
    return proposalMilestones.slice(0, 7).map((milestone, index) => ({
      title: clean(milestone.title, `Milestone ${index + 1}`, 180),
      description: clean(milestone.description, "Complete the agreed project phase.", 800),
      durationDays: clamp(Math.round((milestone.durationWeeks || 1) * 7), 1, 60),
      tasks: [
        {
          title: `Plan and prepare ${milestone.title}`,
          description: "Confirm the technical approach, dependencies, and completion criteria for this phase.",
          ownerRole: "Shared team",
        },
        {
          title: `Build ${milestone.title}`,
          description: milestone.description || "Implement the agreed deliverables for this phase.",
          ownerRole: "Shared team",
        },
        {
          title: `Verify ${milestone.title}`,
          description: "Test the completed work and confirm it meets the agreed project outcome.",
          ownerRole: "Shared team",
        },
      ],
    }));
  }

  return [
    ["Discovery and technical design", "Confirm requirements, data flows, architecture, and delivery criteria."],
    ["Core implementation", "Build the primary workflows and technical foundations."],
    ["Integration and quality assurance", "Connect required systems and verify reliability, security, and usability."],
    ["Launch and handover", "Deploy the solution, complete acceptance checks, and hand over operating guidance."],
  ].map(([title, description]) => ({
    title,
    description,
    durationDays: Math.max(5, Math.round(((project.timeline_weeks ?? 8) * 7) / 4)),
    tasks: [
      { title: `${title}: preparation`, description: `Prepare and agree the implementation details for ${title.toLowerCase()}.`, ownerRole: "Shared team" },
      { title: `${title}: delivery`, description, ownerRole: "Shared team" },
      { title: `${title}: verification`, description: "Test the work, record evidence, and confirm the phase is complete.", ownerRole: "Shared team" },
    ],
  }));
}

function matchTalentForRole(role: string, assignments: WorkspaceAssignmentRow[]): string | null {
  if (!role || /shared|team|all/i.test(role)) return null;
  const words = role.toLowerCase().split(/\W+/).filter((word) => word.length > 3);
  const match = assignments.find((assignment) =>
    words.some((word) => assignment.role.toLowerCase().includes(word))
  );
  return match?.talent_id ?? null;
}

function splitAmount(total: number, parts: number): number[] {
  if (parts <= 0) return [];
  const safeTotal = Math.max(0, Math.floor(total));
  const base = Math.floor(safeTotal / parts);
  const remainder = safeTotal % parts;
  return Array.from({ length: parts }, (_, index) => base + (index < remainder ? 1 : 0));
}

function clean(value: unknown, fallback: string, max: number) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
