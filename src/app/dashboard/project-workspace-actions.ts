"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isAdminUser } from "@/lib/auth/admin";
import { fetchProfile } from "@/lib/auth/profile";
import { ensureProjectWorkspace } from "@/lib/ai/workspace";
import {
  createWorkspacePaymentTransaction,
  paddleCheckoutConfigured,
} from "@/lib/payments/paddle";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface WorkspaceActionResult {
  ok: boolean;
  error?: string;
}

export interface SendMessageResult extends WorkspaceActionResult {
  message?: {
    id: string;
    project_id: string;
    sender_id: string;
    sender_role: "client" | "talent" | "admin";
    sender_name: string;
    body: string;
    created_at: string;
  };
}

export async function initializeProjectWorkspace(projectId: string): Promise<WorkspaceActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: participant, error: participantError } = await supabase.rpc("is_project_participant", {
    p_project_id: projectId,
    p_user_id: user.id,
  });
  if (participantError || !participant) return { ok: false, error: "Project access denied" };

  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "Workspace provisioning is not configured" };
  const { data: project } = await admin
    .from("projects")
    .select("payment_status, status")
    .eq("id", projectId)
    .maybeSingle();
  if (!project || project.payment_status !== "paid" || project.status === "awaiting_payment") {
    return { ok: false, error: "The project workspace opens after the initial payment is verified." };
  }
  try {
    await ensureProjectWorkspace(admin, projectId);
  } catch (error) {
    console.error("Could not initialize project workspace", error);
    return { ok: false, error: "The project workspace could not be prepared yet. Please try again." };
  }

  revalidateWorkspacePaths(projectId);
  return { ok: true };
}

export async function completeWorkspaceTask(taskId: string): Promise<WorkspaceActionResult & { progress?: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data, error } = await supabase.rpc("complete_project_task", { p_task_id: taskId });
  if (error || !data?.[0]) return { ok: false, error: error?.message ?? "Task could not be completed" };
  const result = data[0] as { project_progress: number; completed_milestone_id: string };

  const { data: task } = await supabase.from("project_tasks").select("project_id").eq("id", taskId).maybeSingle();
  if (task?.project_id) revalidateWorkspacePaths(task.project_id);
  return { ok: true, progress: result.project_progress };
}

export async function sendWorkspaceMessage(projectId: string, body: string): Promise<SendMessageResult> {
  const cleanBody = body.trim().slice(0, 2000);
  if (!cleanBody) return { ok: false, error: "Write a message first" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const profile = await fetchProfile(supabase, user.id);
  const adminUser = await isAdminUser(supabase, user);
  const senderRole = adminUser ? "admin" : profile?.role;
  if (senderRole !== "admin" && senderRole !== "client" && senderRole !== "talent") {
    return { ok: false, error: "Project messaging is unavailable for this account" };
  }

  const { data, error } = await supabase
    .from("project_messages")
    .insert({ project_id: projectId, sender_id: user.id, sender_role: senderRole, body: cleanBody })
    .select("id, project_id, sender_id, sender_role, body, created_at")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Message could not be sent" };

  revalidateWorkspacePaths(projectId);
  return {
    ok: true,
    message: {
      ...data,
      sender_role: senderRole,
      sender_name: senderRole === "admin" ? "Somahorse control room" : profile?.full_name ?? "Project participant",
    },
  };
}

export async function prepareWorkspacePayment(formData: FormData): Promise<void> {
  if (!paddleCheckoutConfigured()) throw new Error("Paddle checkout is not configured");
  const projectId = String(formData.get("projectId") ?? "");
  const kind = String(formData.get("kind") ?? "");
  const milestoneId = String(formData.get("milestoneId") ?? "") || null;
  if (!projectId || (kind !== "build_stage" && kind !== "monthly")) {
    throw new Error("Invalid project payment request");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: project } = await supabase
    .from("projects")
    .select("id, client_id, title, status, monthly_fee_amount, currency")
    .eq("id", projectId)
    .eq("client_id", user.id)
    .maybeSingle();
  if (!project) throw new Error("Project not found");

  const admin = createAdminClient();
  if (!admin) throw new Error("Secure project payments are not configured");

  let amount = 0;
  let description = "";
  let periodKey: string | null = null;
  if (kind === "build_stage") {
    if (!milestoneId) throw new Error("Milestone is required");
    const { data: milestone } = await admin
      .from("project_milestones")
      .select("id, title, payment_amount, payment_status")
      .eq("id", milestoneId)
      .eq("project_id", projectId)
      .maybeSingle();
    if (!milestone || milestone.payment_status !== "due" || Number(milestone.payment_amount) <= 0) {
      throw new Error("This milestone is not ready for payment");
    }
    amount = Number(milestone.payment_amount);
    description = `Completed milestone: ${milestone.title}`;
  } else {
    if (!["monitoring", "delivered"].includes(project.status)) {
      throw new Error("Monthly support billing begins after delivery");
    }
    amount = Number(project.monthly_fee_amount ?? 0);
    if (amount <= 0) throw new Error("No monthly support fee is configured");
    periodKey = new Date().toISOString().slice(0, 7);
    description = `Managed monitoring and support · ${periodKey}`;
  }

  let existingQuery = admin
    .from("payments")
    .select("id, provider_transaction_id, status")
    .eq("project_id", projectId)
    .in("status", ["pending", "paid"]);
  existingQuery = kind === "build_stage"
    ? existingQuery.eq("workspace_milestone_id", milestoneId)
    : existingQuery.eq("kind", "monthly").eq("period_key", periodKey);
  const { data: existing } = await existingQuery.maybeSingle();
  if (existing) {
    if (existing.status === "paid") redirect(`/dashboard/client/projects/${projectId}`);
    redirect(`/dashboard/client/projects/${projectId}/checkout/${existing.id}`);
  }

  const paymentId = randomUUID();
  const transaction = await createWorkspacePaymentTransaction({
    paymentId,
    projectId,
    clientId: user.id,
    title: project.title,
    description,
    amountZar: amount,
    kind,
    milestoneId,
    periodKey,
  });
  const { error: insertError } = await admin.from("payments").insert({
    id: paymentId,
    project_id: projectId,
    client_id: user.id,
    provider_transaction_id: transaction.id,
    kind,
    amount,
    currency: project.currency ?? "ZAR",
    status: "pending",
    workspace_milestone_id: milestoneId,
    period_key: periodKey,
    description,
  });
  if (insertError) throw new Error(insertError.message);

  if (milestoneId) {
    await admin.from("project_milestones").update({ payment_status: "pending" }).eq("id", milestoneId);
  }
  revalidateWorkspacePaths(projectId);
  redirect(`/dashboard/client/projects/${projectId}/checkout/${paymentId}`);
}

export async function settleTalentEarning(formData: FormData): Promise<void> {
  const earningId = String(formData.get("earningId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  const reference = String(formData.get("reference") ?? "").trim().slice(0, 160);
  if (!earningId || !projectId) throw new Error("Invalid payout record");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!(await isAdminUser(supabase, user))) throw new Error("Not authorized");
  const admin = createAdminClient();
  if (!admin) throw new Error("Admin payouts are not configured");

  const paidAt = new Date().toISOString();
  const { data: earning, error } = await admin
    .from("talent_earnings")
    .update({
      status: "paid",
      paid_at: paidAt,
      payout_reference: reference || `Manual payout · ${paidAt.slice(0, 10)}`,
    })
    .eq("id", earningId)
    .eq("project_id", projectId)
    .eq("status", "owed")
    .select("talent_id, amount_owed")
    .maybeSingle();
  if (error || !earning) throw new Error(error?.message ?? "Earning is already settled");

  await admin.from("notifications").insert({
    recipient_user_id: earning.talent_id,
    recipient_role: "talent",
    project_id: projectId,
    type: "payout_completed",
    title: "Project earnings paid",
    message: "The control room marked your project earnings as paid.",
    payload: { earning_id: earningId, amount: earning.amount_owed },
  });
  revalidateWorkspacePaths(projectId);
  revalidatePath("/admin/projects");
}

export async function closeProjectWorkspace(formData: FormData): Promise<void> {
  const projectId = String(formData.get("projectId") ?? "");
  if (!projectId) throw new Error("Invalid project");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!(await isAdminUser(supabase, user))) throw new Error("Not authorized");
  const admin = createAdminClient();
  if (!admin) throw new Error("Admin project controls are not configured");

  const [{ data: workspace }, { count: unpaidMilestones }] = await Promise.all([
    admin.from("project_workspaces").select("progress_percent").eq("project_id", projectId).maybeSingle(),
    admin
      .from("project_milestones")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .gt("payment_amount", 0)
      .neq("payment_status", "paid"),
  ]);
  if (!workspace || workspace.progress_percent !== 100) throw new Error("All delivery tasks must be complete first");
  if ((unpaidMilestones ?? 0) > 0) throw new Error("All milestone payments must be settled first");

  const completedAt = new Date().toISOString();
  const { data: assignments } = await admin
    .from("project_assignments")
    .select("talent_id")
    .eq("project_id", projectId)
    .in("status", ["assigned", "active"]);
  const talentIds = (assignments ?? []).map((item) => item.talent_id);
  await Promise.all([
    admin.from("project_workspaces").update({ status: "completed", completed_at: completedAt }).eq("project_id", projectId),
    admin.from("projects").update({ status: "delivered" }).eq("id", projectId),
    admin.from("project_assignments").update({ status: "completed" }).eq("project_id", projectId).in("status", ["assigned", "active"]),
  ]);
  if (talentIds.length) {
    await admin.from("talent_onboarding").update({ availability_status: "available" }).in("id", talentIds);
  }
  revalidateWorkspacePaths(projectId);
  revalidatePath("/admin/projects");
}

function revalidateWorkspacePaths(projectId: string) {
  revalidatePath(`/dashboard/client/projects/${projectId}`);
  revalidatePath(`/dashboard/talent/projects/${projectId}`);
  revalidatePath(`/admin/projects/${projectId}/workspace`);
  revalidatePath("/dashboard/client/projects");
  revalidatePath("/dashboard/talent/projects");
  revalidatePath("/dashboard/talent/payments");
}
