"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import { fetchAvailableDevelopers } from "@/lib/dashboard/data";
import {
  createDepositTransaction,
  paddleCheckoutConfigured,
  type LocalizedPaddleTransaction,
} from "@/lib/payments/paddle";
import { normalizeIntakeState, normalizeProposal } from "@/lib/projects/pricing";
import type { ProposedTeamMember } from "@/lib/projects/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface PrepareCheckoutResult {
  ok: boolean;
  projectId?: string;
  checkoutPath?: string;
  alreadyPaid?: boolean;
  error?: string;
}

export async function prepareProjectCheckout(
  conversationId: string
): Promise<PrepareCheckoutResult> {
  if (!paddleCheckoutConfigured()) {
    return {
      ok: false,
      error:
        "Paddle checkout is not configured yet. Add the Paddle API key and client-side token before taking payment.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const admin = createAdminClient();
  if (!admin) {
    return { ok: false, error: "Secure project creation is not configured." };
  }
  const { data: currencyProfile } = await admin
    .from("profiles")
    .select("preferred_currency, country_code")
    .eq("id", user.id)
    .maybeSingle();

  const { data: conversation, error: conversationError } = await supabase
    .from("intake_conversations")
    .select(
      "id, client_id, stage, intake_state, proposal, proposed_team, project_id"
    )
    .eq("id", conversationId)
    .eq("client_id", user.id)
    .maybeSingle();
  if (conversationError || !conversation) {
    return { ok: false, error: "Could not load this saved proposal." };
  }

  if (conversation.project_id) {
    const { data: existing } = await admin
      .from("projects")
      .select("id, title, deposit_amount, payment_status, paddle_transaction_id")
      .eq("id", conversation.project_id)
      .eq("client_id", user.id)
      .maybeSingle();
    if (!existing) return { ok: false, error: "Could not load the prepared project." };
    if (existing.payment_status === "paid") {
      return {
        ok: true,
        projectId: existing.id,
        checkoutPath: "/dashboard/client/projects",
        alreadyPaid: true,
      };
    }
    if (existing.paddle_transaction_id) {
      return {
        ok: true,
        projectId: existing.id,
        checkoutPath: `/dashboard/client/checkout/${existing.id}`,
      };
    }
    try {
      const localized = await createDepositTransaction({
        projectId: existing.id,
        conversationId: conversation.id,
        clientId: user.id,
        title: existing.title,
        depositZar: Number(existing.deposit_amount),
        preferredCurrency: currencyProfile?.preferred_currency,
        countryCode: currencyProfile?.country_code,
      });
      await attachLocalizedDeposit(admin, existing.id, localized);
      return {
        ok: true,
        projectId: existing.id,
        checkoutPath: `/dashboard/client/checkout/${existing.id}`,
      };
    } catch (error) {
      console.error("Could not resume Paddle checkout", error);
      return {
        ok: false,
        projectId: existing.id,
        error: "The project is safely prepared, but Paddle could not open checkout. Please try again.",
      };
    }
  }

  if (conversation.stage !== "proposal_ready" || !conversation.proposal) {
    return { ok: false, error: "Finish the intake before starting the project." };
  }

  const proposal = normalizeProposal(
    conversation.proposal,
    normalizeIntakeState(conversation.intake_state)
  );
  if (!proposal) {
    return { ok: false, error: "The saved proposal is incomplete. Continue the intake once more." };
  }

  const available = await fetchAvailableDevelopers(supabase);
  const availableById = new Map(available.map((developer) => [developer.id, developer]));
  const proposed = Array.isArray(conversation.proposed_team)
    ? (conversation.proposed_team as ProposedTeamMember[])
    : [];
  const safeTeam = proposed
    .filter((member) => availableById.has(member.id))
    .map((member) => {
      const developer = availableById.get(member.id)!;
      return {
        id: member.id,
        name: developer.full_name ?? "Certified Somahorse specialist",
        role: String(member.role || developer.primary_role || "Project engineer").slice(0, 160),
        matchScore: Math.max(0, Math.min(100, Math.round(Number(member.matchScore) || 0))),
        reason: String(member.reason || "Selected for this scope.").slice(0, 500),
      };
    });

  if (safeTeam.length === 0) {
    return {
      ok: false,
      error:
        "The proposed specialists are no longer available. Refresh the team before starting the project.",
    };
  }

  const requestedProjectId = randomUUID();
  const { data: preparedProjectId, error: prepareError } = await admin.rpc(
    "prepare_project_checkout",
    {
      p_project_id: requestedProjectId,
      p_conversation_id: conversation.id,
      p_proposal: proposal,
      p_team: safeTeam,
      p_sector: null,
    }
  );
  if (prepareError || !preparedProjectId) {
    return { ok: false, error: prepareError?.message ?? "Could not prepare the project." };
  }

  const projectId = preparedProjectId as string;
  const { data: project, error: projectError } = await admin
    .from("projects")
    .select("id, title, deposit_amount, paddle_transaction_id, payment_status")
    .eq("id", projectId)
    .eq("client_id", user.id)
    .single();
  if (projectError || !project) {
    return { ok: false, error: "Could not load the prepared project." };
  }

  if (!project.paddle_transaction_id) {
    try {
      const localized = await createDepositTransaction({
        projectId,
        conversationId: conversation.id,
        clientId: user.id,
        title: project.title,
        depositZar: Number(project.deposit_amount),
        preferredCurrency: currencyProfile?.preferred_currency,
        countryCode: currencyProfile?.country_code,
      });
      await attachLocalizedDeposit(admin, projectId, localized);
    } catch (error) {
      console.error("Could not create Paddle checkout", error);
      return {
        ok: false,
        projectId,
        error:
          "The project is safely prepared, but Paddle could not open checkout. Try Start project again.",
      };
    }
  }

  revalidatePath("/dashboard/client/projects");
  revalidatePath("/dashboard/client");
  return {
    ok: true,
    projectId,
    checkoutPath: `/dashboard/client/checkout/${projectId}`,
  };
}

async function attachLocalizedDeposit(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  projectId: string,
  localized: LocalizedPaddleTransaction
) {
  const { transaction, quote } = localized;
  const { error } = await admin.rpc("attach_localized_checkout_transaction", {
    p_project_id: projectId,
    p_transaction_id: transaction.id,
    p_presentment_amount_minor: quote.presentmentAmountMinor,
    p_presentment_currency: quote.presentmentCurrency,
    p_requested_currency: quote.requestedCurrency,
    p_country_code: quote.countryCode,
    p_fx_rate: quote.fxRate,
    p_fx_source: quote.fxSource,
    p_fx_quoted_at: quote.quotedAt,
  });
  if (error) throw new Error(error.message);
}
