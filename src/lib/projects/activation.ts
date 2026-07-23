import "server-only";

import {
  sendProjectEarningsTalent,
  sendProjectAssignmentTalent,
  sendProjectFundedAdmin,
  sendProjectPaymentAdmin,
  sendProjectPaymentClient,
  sendProjectStartedClient,
} from "@/lib/email";
import {
  formatMinorMoney,
  formatMoney,
} from "@/lib/currency/config";
import { formatZar } from "@/lib/projects/pricing";
import { ensureProjectWorkspace } from "@/lib/ai/workspace";
import { createAdminClient } from "@/lib/supabase/admin";

interface ActivationRow {
  activated_project_id: string;
  project_status: string;
  assigned_talent_ids: string[];
  processed_new: boolean;
}

interface CompletedTransactionLike {
  id: string;
  status: string;
  customData: unknown;
  invoiceNumber: string | null;
  subscriptionId: string | null;
}

function firstName(fullName: string | null): string | null {
  return fullName?.trim().split(/\s+/)[0] ?? null;
}

export async function activateCompletedTransaction({
  transaction,
  eventId,
  eventType,
  occurredAt,
}: {
  transaction: CompletedTransactionLike;
  eventId: string;
  eventType: string;
  occurredAt: string;
}): Promise<ActivationRow> {
  if (transaction.status !== "completed") {
    throw new Error(`Transaction ${transaction.id} is not completed`);
  }

  const admin = createAdminClient();
  if (!admin) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for project activation");
  }

  const { data: project, error: projectError } = await admin
    .from("projects")
    .select("id, client_id")
    .eq("paddle_transaction_id", transaction.id)
    .maybeSingle();
  if (projectError || !project) {
    throw new Error("No Somahorse project is linked to this Paddle transaction");
  }

  const customData =
    transaction.customData && typeof transaction.customData === "object"
      ? (transaction.customData as Record<string, unknown>)
      : null;
  const customProjectId = customData?.project_id;
  if (customProjectId && customProjectId !== project.id) {
    throw new Error("Paddle project reference does not match");
  }

  const { data, error } = await admin.rpc("activate_paid_project", {
    p_project_id: project.id,
    p_transaction_id: transaction.id,
    p_event_id: eventId,
    p_event_type: eventType,
    p_paid_at: occurredAt,
    p_invoice_number: transaction.invoiceNumber,
    p_subscription_id: transaction.subscriptionId,
    p_payload: {
      transaction_id: transaction.id,
      status: transaction.status,
      invoice_number: transaction.invoiceNumber,
      subscription_id: transaction.subscriptionId,
    },
  });
  if (error || !data?.[0]) {
    throw new Error(error?.message ?? "Could not activate paid project");
  }

  const activation = data[0] as ActivationRow;
  const { data: payment } = await admin
    .from("payments")
    .select("id")
    .eq("provider_transaction_id", transaction.id)
    .maybeSingle();
  if (payment?.id) {
    const { error: earningsError } = await admin.rpc("allocate_talent_earnings_for_payment", {
      p_payment_id: payment.id,
    });
    if (earningsError) console.error("Could not allocate deposit earnings", earningsError);
  }
  if (activation.processed_new) {
    try {
      await ensureProjectWorkspace(admin, activation.activated_project_id);
    } catch (error) {
      console.error("Project activated but workspace provisioning needs a retry", error);
    }
  }
  // Dispatch on every reconciliation. Stable email dedupe keys make this safe,
  // and a repeated webhook repairs an outbox row that was never created if the
  // first request stopped after the payment transaction committed.
  await sendActivationEmails(
    admin,
    activation.activated_project_id,
    activation.project_status
  );
  return activation;
}

export async function reconcileCompletedTransaction(args: {
  transaction: CompletedTransactionLike;
  eventId: string;
  eventType: string;
  occurredAt: string;
}): Promise<{ kind: "deposit" | "workspace"; projectId: string; paymentId?: string }> {
  const customData =
    args.transaction.customData && typeof args.transaction.customData === "object"
      ? (args.transaction.customData as Record<string, unknown>)
      : {};
  const paymentKind = customData.payment_kind;
  if (!paymentKind || paymentKind === "deposit") {
    const activation = await activateCompletedTransaction(args);
    return { kind: "deposit", projectId: activation.activated_project_id };
  }
  if (!["build_stage", "delivery", "monthly"].includes(String(paymentKind))) {
    throw new Error("Unsupported Somahorse payment kind");
  }
  if (args.transaction.status !== "completed") throw new Error("Transaction is not completed");

  const admin = createAdminClient();
  if (!admin) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for payment reconciliation");
  const { data: payment } = await admin
    .from("payments")
    .select("id, project_id, provider_transaction_id")
    .eq("provider_transaction_id", args.transaction.id)
    .maybeSingle();
  if (!payment) throw new Error("No workspace payment is linked to this Paddle transaction");
  if (customData.payment_id && customData.payment_id !== payment.id) throw new Error("Paddle payment reference does not match");
  if (customData.project_id && customData.project_id !== payment.project_id) throw new Error("Paddle project reference does not match");

  const { data, error } = await admin.rpc("record_workspace_payment", {
    p_transaction_id: args.transaction.id,
    p_event_id: args.eventId,
    p_event_type: args.eventType,
    p_paid_at: args.occurredAt,
    p_invoice_number: args.transaction.invoiceNumber,
    p_payload: {
      transaction_id: args.transaction.id,
      status: args.transaction.status,
      payment_kind: paymentKind,
    },
  });
  if (error || !data?.[0]) throw new Error(error?.message ?? "Workspace payment could not be recorded");
  await sendWorkspacePaymentEmails(admin, payment.id);
  return { kind: "workspace", projectId: payment.project_id, paymentId: payment.id };
}

async function sendActivationEmails(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  projectId: string,
  projectStatus: string
) {
  const { data: project } = await admin
    .from("projects")
    .select("id, client_id, title, deposit_amount")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) return;

  const [{ data: clientProfile }, { data: clientOnboarding }, { data: payment }, { data: assignments }] =
    await Promise.all([
      admin.from("profiles").select("full_name, email").eq("id", project.client_id).maybeSingle(),
      admin.from("client_onboarding").select("company_name").eq("id", project.client_id).maybeSingle(),
      admin
        .from("payments")
        .select("id, invoice_number, presentment_amount_minor, presentment_currency")
        .eq("project_id", projectId)
        .eq("kind", "deposit")
        .eq("status", "paid")
        .order("paid_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin
        .from("project_assignments")
        .select("talent_id, role, status")
        .eq("project_id", projectId)
        .eq("status", "assigned"),
    ]);

  const { data: earnings } = payment?.id
    ? await admin
        .from("talent_earnings")
        .select("talent_id, amount_owed")
        .eq("payment_id", payment.id)
    : {
        data: [] as Array<{ talent_id: string; amount_owed: number }>,
      };
  const talentIds = [
    ...new Set([
      ...(assignments ?? []).map((assignment) => assignment.talent_id),
      ...(earnings ?? []).map((earning) => earning.talent_id),
    ]),
  ];
  const { data: talentProfiles } = talentIds.length
    ? await admin
        .from("profiles")
        .select("id, full_name, email, preferred_currency")
        .in("id", talentIds)
    : {
        data: [] as Array<{
          id: string;
          full_name: string | null;
          email: string | null;
          preferred_currency: string;
        }>,
      };
  const profileById = new Map((talentProfiles ?? []).map((profile) => [profile.id, profile]));

  const { data: admins } = await admin.from("admins").select("email");
  const depositZar =
    formatMinorMoney(
      payment?.presentment_amount_minor,
      payment?.presentment_currency
    ) ?? formatZar(Number(project.deposit_amount ?? 0));
  const teamSummary = (assignments ?? [])
    .map((assignment) => {
      const profile = profileById.get(assignment.talent_id);
      return `${profile?.full_name ?? "Certified specialist"} (${assignment.role})`;
    })
    .join(", ");

  await Promise.all([
    sendProjectStartedClient({
      to: clientProfile?.email ?? null,
      firstName: firstName(clientProfile?.full_name ?? null),
      projectId,
      projectTitle: project.title,
      depositZar,
      clientId: project.client_id,
    }),
    ...(assignments ?? []).map((assignment) => {
      const profile = profileById.get(assignment.talent_id);
      return sendProjectAssignmentTalent({
        to: profile?.email ?? null,
        firstName: firstName(profile?.full_name ?? null),
        projectId,
        talentId: assignment.talent_id,
        projectTitle: project.title,
        role: assignment.role,
      });
    }),
    ...(earnings ?? []).map((earning) => {
      const profile = profileById.get(earning.talent_id);
      return sendProjectEarningsTalent({
        to: profile?.email ?? null,
        firstName: firstName(profile?.full_name ?? null),
        talentId: earning.talent_id,
        projectId,
        paymentId: payment!.id,
        projectTitle: project.title,
        paymentLabel: "project deposit",
        allocationAmount: formatMoney(Number(earning.amount_owed), "ZAR", {
          maximumFractionDigits: 0,
        }),
        preferredCurrency: profile?.preferred_currency ?? "ZAR",
      });
    }),
    ...(admins ?? []).map((adminContact) =>
      sendProjectFundedAdmin({
        to: adminContact.email,
        projectId,
        projectTitle: project.title,
        companyName: clientOnboarding?.company_name ?? null,
        depositZar,
        invoiceNumber: payment?.invoice_number ?? null,
        teamSummary,
        needsStaffingAttention: projectStatus === "matching",
      })
    ),
  ]);
}

async function sendWorkspacePaymentEmails(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  paymentId: string
) {
  const { data: payment } = await admin
    .from("payments")
    .select(
      "id, project_id, client_id, kind, amount, currency, presentment_amount_minor, presentment_currency, invoice_number"
    )
    .eq("id", paymentId)
    .maybeSingle();
  if (!payment) return;

  const [
    { data: project },
    { data: client },
    { data: earnings },
    { data: admins },
  ] = await Promise.all([
    admin.from("projects").select("title").eq("id", payment.project_id).maybeSingle(),
    admin.from("profiles").select("full_name, email").eq("id", payment.client_id).maybeSingle(),
    admin
      .from("talent_earnings")
      .select("talent_id, amount_owed")
      .eq("payment_id", payment.id),
    admin.from("admins").select("email"),
  ]);
  if (!project) return;

  const talentIds = (earnings ?? []).map((earning) => earning.talent_id);
  const { data: talentProfiles } = talentIds.length
    ? await admin
        .from("profiles")
        .select("id, full_name, email, preferred_currency")
        .in("id", talentIds)
    : {
        data: [] as Array<{
          id: string;
          full_name: string | null;
          email: string | null;
          preferred_currency: string;
        }>,
      };
  const profileById = new Map(
    (talentProfiles ?? []).map((profile) => [profile.id, profile])
  );
  const paymentLabel = workspacePaymentLabel(payment.kind);
  const paidAmount =
    formatMinorMoney(
      payment.presentment_amount_minor,
      payment.presentment_currency
    ) ?? formatMoney(Number(payment.amount), payment.currency);
  const baseAmount = formatMoney(Number(payment.amount), payment.currency, {
    maximumFractionDigits: 0,
  });

  await Promise.all([
    sendProjectPaymentClient({
      to: client?.email ?? null,
      firstName: firstName(client?.full_name ?? null),
      clientId: payment.client_id,
      projectId: payment.project_id,
      paymentId: payment.id,
      projectTitle: project.title,
      paymentLabel,
      paidAmount,
      baseAmount,
      invoiceNumber: payment.invoice_number,
    }),
    ...(earnings ?? []).map((earning) => {
      const profile = profileById.get(earning.talent_id);
      return sendProjectEarningsTalent({
        to: profile?.email ?? null,
        firstName: firstName(profile?.full_name ?? null),
        talentId: earning.talent_id,
        projectId: payment.project_id,
        paymentId: payment.id,
        projectTitle: project.title,
        paymentLabel,
        allocationAmount: formatMoney(Number(earning.amount_owed), "ZAR", {
          maximumFractionDigits: 0,
        }),
        preferredCurrency: profile?.preferred_currency ?? "ZAR",
      });
    }),
    ...(admins ?? []).map((adminContact) =>
      sendProjectPaymentAdmin({
        to: adminContact.email,
        projectId: payment.project_id,
        paymentId: payment.id,
        projectTitle: project.title,
        paymentLabel,
        paidAmount,
        baseAmount,
        invoiceNumber: payment.invoice_number,
      })
    ),
  ]);
}

function workspacePaymentLabel(kind: string): string {
  if (kind === "monthly") return "monthly support payment";
  if (kind === "delivery") return "delivery payment";
  return "milestone payment";
}
