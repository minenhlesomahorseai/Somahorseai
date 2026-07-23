import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { ProjectProposal } from "@/lib/projects/types";

export type WorkspaceRole = "client" | "talent" | "admin";

export interface WorkspaceProject {
  id: string;
  client_id: string;
  title: string;
  summary: string | null;
  status: string;
  proposal: ProjectProposal | null;
  timeline_weeks: number | null;
  build_fee_amount: number | null;
  deposit_amount: number | null;
  monthly_fee_amount: number | null;
  currency: string;
  started_at: string | null;
}

export interface ProjectWorkspaceRecord {
  project_id: string;
  status: string;
  generated_by: string;
  progress_percent: number;
  expected_completion_at: string | null;
  generated_at: string;
  completed_at: string | null;
}

export interface WorkspaceTask {
  id: string;
  project_id: string;
  milestone_id: string;
  title: string;
  description: string | null;
  sequence: number;
  assigned_talent_id: string | null;
  status: "todo" | "in_progress" | "completed";
  completed_by: string | null;
  completed_at: string | null;
}

export interface WorkspaceMilestone {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  sequence: number;
  duration_days: number;
  status: "planned" | "in_progress" | "completed";
  payment_amount: number;
  payment_status: "not_due" | "due" | "pending" | "paid" | "waived";
  completed_at: string | null;
  tasks: WorkspaceTask[];
}

export interface WorkspaceMember {
  id: string;
  fullName: string | null;
  role: string;
  participantRole: WorkspaceRole;
  assignmentStatus?: string;
}

export interface WorkspaceMessage {
  id: string;
  project_id: string;
  sender_id: string;
  sender_role: WorkspaceRole;
  sender_name: string;
  body: string;
  created_at: string;
}

export interface WorkspaceMessageRead {
  project_id: string;
  user_id: string;
  last_read_at: string;
  updated_at: string;
}

export interface WorkspacePayment {
  id: string;
  project_id: string;
  kind: "deposit" | "build_stage" | "delivery" | "monthly";
  amount: number;
  currency: string;
  base_currency: string;
  presentment_amount_minor: number | null;
  presentment_currency: string | null;
  fx_rate: number | null;
  fx_source: string | null;
  fx_quoted_at: string | null;
  status: "pending" | "paid" | "failed" | "refunded";
  invoice_number: string | null;
  workspace_milestone_id: string | null;
  period_key: string | null;
  description: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface WorkspaceEarning {
  id: string;
  project_id: string;
  payment_id: string;
  talent_id: string;
  talent_name: string;
  client_payment_amount: number;
  talent_pool_amount: number;
  amount_owed: number;
  share_percent: number;
  status: "owed" | "paid" | "held" | "cancelled";
  paid_at: string | null;
  payout_reference: string | null;
  payout_amount_minor: number | null;
  payout_currency: string | null;
  payout_fx_rate: number | null;
  payout_fx_source: string | null;
  payout_fx_quoted_at: string | null;
  talent_currency: string;
  created_at: string;
}

export interface ProjectWorkspaceData {
  project: WorkspaceProject;
  workspace: ProjectWorkspaceRecord | null;
  milestones: WorkspaceMilestone[];
  members: WorkspaceMember[];
  messages: WorkspaceMessage[];
  messageReads: WorkspaceMessageRead[];
  payments: WorkspacePayment[];
  earnings: WorkspaceEarning[];
  clientName: string;
}

export async function fetchProjectWorkspaceData(
  admin: SupabaseClient,
  projectId: string
): Promise<ProjectWorkspaceData | null> {
  const { data: rawProject } = await admin
    .from("projects")
    .select(
      "id, client_id, title, summary, status, proposal, timeline_weeks, build_fee_amount, deposit_amount, monthly_fee_amount, currency, started_at"
    )
    .eq("id", projectId)
    .maybeSingle();
  if (!rawProject) return null;
  const project = rawProject as WorkspaceProject;

  const [workspaceResult, milestonesResult, tasksResult, assignmentsResult, messagesResult, messageReadsResult, paymentsResult, earningsResult] =
    await Promise.all([
      admin.from("project_workspaces").select("project_id, status, generated_by, progress_percent, expected_completion_at, generated_at, completed_at").eq("project_id", projectId).maybeSingle(),
      admin.from("project_milestones").select("id, project_id, title, description, sequence, duration_days, status, payment_amount, payment_status, completed_at").eq("project_id", projectId).order("sequence"),
      admin.from("project_tasks").select("id, project_id, milestone_id, title, description, sequence, assigned_talent_id, status, completed_by, completed_at").eq("project_id", projectId).order("sequence"),
      admin.from("project_assignments").select("talent_id, role, status").eq("project_id", projectId).in("status", ["assigned", "active", "completed"]),
      admin.from("project_messages").select("id, project_id, sender_id, sender_role, body, created_at").eq("project_id", projectId).order("created_at").limit(250),
      admin.from("project_message_reads").select("project_id, user_id, last_read_at, updated_at").eq("project_id", projectId),
      admin.from("payments").select("id, project_id, kind, amount, currency, base_currency, presentment_amount_minor, presentment_currency, fx_rate, fx_source, fx_quoted_at, status, invoice_number, workspace_milestone_id, period_key, description, paid_at, created_at").eq("project_id", projectId).order("created_at", { ascending: false }),
      admin.from("talent_earnings").select("id, project_id, payment_id, talent_id, client_payment_amount, talent_pool_amount, amount_owed, share_percent, status, paid_at, payout_reference, payout_amount_minor, payout_currency, payout_fx_rate, payout_fx_source, payout_fx_quoted_at, created_at").eq("project_id", projectId).order("created_at", { ascending: false }),
    ]);

  const assignments = (assignmentsResult.data ?? []) as Array<{ talent_id: string; role: string; status: string }>;
  const rawMessages = (messagesResult.data ?? []) as Array<Omit<WorkspaceMessage, "sender_name">>;
  const rawEarnings = (earningsResult.data ?? []) as Array<
    Omit<WorkspaceEarning, "talent_name" | "talent_currency">
  >;
  const profileIds = [...new Set([project.client_id, ...assignments.map((item) => item.talent_id), ...rawMessages.map((item) => item.sender_id), ...rawEarnings.map((item) => item.talent_id)])];
  const { data: profiles } = profileIds.length
    ? await admin.from("profiles").select("id, full_name, preferred_currency").in("id", profileIds)
    : { data: [] as Array<{ id: string; full_name: string | null; preferred_currency: string }> };
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]));
  const currencyById = new Map((profiles ?? []).map((profile) => [profile.id, profile.preferred_currency]));
  const clientName = profileById.get(project.client_id) ?? "Client";

  const tasks = (tasksResult.data ?? []) as WorkspaceTask[];
  const milestones = ((milestonesResult.data ?? []) as Array<Omit<WorkspaceMilestone, "tasks">>).map((milestone) => ({
    ...milestone,
    tasks: tasks.filter((task) => task.milestone_id === milestone.id),
  }));
  const members: WorkspaceMember[] = [
    { id: project.client_id, fullName: clientName, role: "Project client", participantRole: "client" },
    ...assignments.map((assignment) => ({
      id: assignment.talent_id,
      fullName: profileById.get(assignment.talent_id) ?? "Talent member",
      role: assignment.role,
      participantRole: "talent" as const,
      assignmentStatus: assignment.status,
    })),
  ];

  return {
    project,
    workspace: (workspaceResult.data as ProjectWorkspaceRecord | null) ?? null,
    milestones,
    members,
    messages: rawMessages.map((message) => ({
      ...message,
      sender_name:
        message.sender_role === "admin"
          ? "Somahorse control room"
          : profileById.get(message.sender_id) ?? (message.sender_role === "client" ? "Client" : "Talent member"),
    })),
    messageReads: (messageReadsResult.data ?? []) as WorkspaceMessageRead[],
    payments: (paymentsResult.data ?? []) as WorkspacePayment[],
    earnings: rawEarnings.map((earning) => ({
      ...earning,
      talent_name: profileById.get(earning.talent_id) ?? "Talent member",
      talent_currency: currencyById.get(earning.talent_id) ?? "ZAR",
    })),
    clientName,
  };
}
