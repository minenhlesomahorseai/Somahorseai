import { siteUrl } from "@/lib/site";

import { CLIENT_WELCOME_MD, HOW_IT_WORKS_MD } from "./assets";
import {
  dispatchEmail,
  type EmailAttachment,
  type SendResult,
} from "./delivery";
import {
  assessmentInviteEmail,
  assessmentReceivedEmail,
  clientOnboardingReceivedEmail,
  clientWelcomeEmail,
  interviewConfirmedEmail,
  interviewProposalDeclinedEmail,
  interviewProposalEmail,
  interviewSchedulingInviteEmail,
  projectAssignmentTalentEmail,
  projectEarningsTalentEmail,
  projectFundedAdminEmail,
  projectPaymentAdminEmail,
  projectPaymentClientEmail,
  projectStartedClientEmail,
  talentPayoutAdminEmail,
  talentPayoutEmail,
  talentApplicationReceivedEmail,
  talentApprovedEmail,
  talentRejectedEmail,
  talentWelcomeEmail,
} from "./templates";

export type { EmailAttachment, EmailHealth, SendResult } from "./delivery";
export {
  getEmailHealth,
  processPendingEmails,
  retryEmailDelivery,
  retryFailedEmails,
} from "./delivery";

function eventPart(value: string | null | undefined): string {
  return (value ?? "unknown").trim().toLowerCase();
}

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM?.trim());
}

export function sendClientWelcome(opts: {
  to: string | null;
  firstName: string | null;
  userId?: string;
}): Promise<SendResult> {
  return dispatchEmail({
    dedupeKey: `client-welcome:${eventPart(opts.userId ?? opts.to)}`,
    category: "client_welcome",
    to: opts.to,
    recipientUserId: opts.userId,
    email: clientWelcomeEmail({
      firstName: opts.firstName,
      dashboardUrl: siteUrl("/onboarding/client"),
    }),
    attachments: [
      {
        filename: "welcome-to-somahorse.md",
        content: Buffer.from(CLIENT_WELCOME_MD, "utf8"),
        contentType: "text/markdown",
      },
      {
        filename: "how-somahorse-works.md",
        content: Buffer.from(HOW_IT_WORKS_MD, "utf8"),
        contentType: "text/markdown",
      },
    ],
  });
}

export function sendTalentWelcome(opts: {
  to: string | null;
  firstName: string | null;
  userId?: string;
}): Promise<SendResult> {
  return dispatchEmail({
    dedupeKey: `talent-welcome:${eventPart(opts.userId ?? opts.to)}`,
    category: "talent_welcome",
    to: opts.to,
    recipientUserId: opts.userId,
    email: talentWelcomeEmail({
      firstName: opts.firstName,
      statusUrl: siteUrl("/onboarding/talent"),
    }),
  });
}

export function sendTalentApplicationReceived(opts: {
  to: string | null;
  firstName: string | null;
  userId: string;
}): Promise<SendResult> {
  return dispatchEmail({
    dedupeKey: `talent-application-received:${opts.userId}`,
    category: "talent_application_received",
    to: opts.to,
    recipientUserId: opts.userId,
    email: talentApplicationReceivedEmail({
      firstName: opts.firstName,
      statusUrl: siteUrl("/onboarding/talent"),
    }),
  });
}

export function sendClientOnboardingReceived(opts: {
  to: string | null;
  firstName: string | null;
  userId: string;
}): Promise<SendResult> {
  return dispatchEmail({
    dedupeKey: `client-onboarding-received:${opts.userId}`,
    category: "client_onboarding_received",
    to: opts.to,
    recipientUserId: opts.userId,
    email: clientOnboardingReceivedEmail({
      firstName: opts.firstName,
      dashboardUrl: siteUrl("/dashboard/client"),
    }),
  });
}

export function sendAssessmentInvite(opts: {
  to: string | null;
  firstName: string | null;
  talentId: string;
  assessmentToken: string;
  timeLimitMinutes: number;
}): Promise<SendResult> {
  return dispatchEmail({
    dedupeKey: `assessment-invite:${opts.assessmentToken}`,
    category: "assessment_invite",
    to: opts.to,
    recipientUserId: opts.talentId,
    email: assessmentInviteEmail({
      firstName: opts.firstName,
      assessmentUrl: siteUrl(`/assessment/${opts.assessmentToken}`),
      timeLimitMinutes: opts.timeLimitMinutes,
    }),
  });
}

export function sendAssessmentReceived(opts: {
  to: string | null;
  firstName: string | null;
  talentId: string;
  assessmentId: string;
}): Promise<SendResult> {
  return dispatchEmail({
    dedupeKey: `assessment-received:${opts.assessmentId}`,
    category: "assessment_received",
    to: opts.to,
    recipientUserId: opts.talentId,
    email: assessmentReceivedEmail({
      firstName: opts.firstName,
      statusUrl: siteUrl("/onboarding/talent"),
    }),
  });
}

export function sendTalentPassed(opts: {
  to: string | null;
  firstName: string | null;
  talentId: string;
  scheduleId: string;
  notes?: string | null;
}): Promise<SendResult> {
  return dispatchEmail({
    dedupeKey: `interview-invite:${opts.scheduleId}`,
    category: "interview_invite",
    to: opts.to,
    recipientUserId: opts.talentId,
    email: interviewSchedulingInviteEmail({
      firstName: opts.firstName,
      schedulingUrl: siteUrl("/onboarding/talent"),
      notes: opts.notes,
    }),
  });
}

export function sendInterviewProposal(opts: {
  to: string | null;
  recipientName: string | null;
  recipientUserId?: string | null;
  proposalId: string;
  proposerName: string;
  when: string;
  schedulingPath: string;
  note?: string | null;
}): Promise<SendResult> {
  return dispatchEmail({
    dedupeKey: `interview-proposal:${opts.proposalId}:${eventPart(opts.to)}`,
    category: "interview_proposal",
    to: opts.to,
    recipientUserId: opts.recipientUserId,
    email: interviewProposalEmail({
      recipientName: opts.recipientName,
      proposerName: opts.proposerName,
      when: opts.when,
      schedulingUrl: siteUrl(opts.schedulingPath),
      note: opts.note,
    }),
  });
}

export function sendInterviewProposalDeclined(opts: {
  to: string | null;
  recipientName: string | null;
  recipientUserId?: string | null;
  proposalId: string;
  when: string;
  schedulingPath: string;
}): Promise<SendResult> {
  return dispatchEmail({
    dedupeKey: `interview-proposal-declined:${opts.proposalId}:${eventPart(opts.to)}`,
    category: "interview_proposal_declined",
    to: opts.to,
    recipientUserId: opts.recipientUserId,
    email: interviewProposalDeclinedEmail({
      recipientName: opts.recipientName,
      when: opts.when,
      schedulingUrl: siteUrl(opts.schedulingPath),
    }),
  });
}

export function sendInterviewConfirmed(opts: {
  to: string | null;
  recipientName: string | null;
  recipientUserId?: string | null;
  proposalId: string;
  talentName: string | null;
  when: string;
  schedulingPath: string;
  googleCalendarUrl: string;
  meetingUrl?: string | null;
  ics: string;
}): Promise<SendResult> {
  const attachments: EmailAttachment[] = [
    {
      filename: "somahorse-interview.ics",
      content: Buffer.from(opts.ics, "utf8"),
      contentType: "text/calendar; charset=utf-8",
    },
  ];
  return dispatchEmail({
    dedupeKey: `interview-confirmed:${opts.proposalId}:${eventPart(opts.to)}`,
    category: "interview_confirmed",
    to: opts.to,
    recipientUserId: opts.recipientUserId,
    email: interviewConfirmedEmail({
      recipientName: opts.recipientName,
      talentName: opts.talentName,
      when: opts.when,
      schedulingUrl: siteUrl(opts.schedulingPath),
      googleCalendarUrl: opts.googleCalendarUrl,
      meetingUrl: opts.meetingUrl,
    }),
    attachments,
  });
}

export function sendTalentApproved(opts: {
  to: string | null;
  firstName: string | null;
  talentId: string;
}): Promise<SendResult> {
  return dispatchEmail({
    dedupeKey: `talent-approved:${opts.talentId}`,
    category: "talent_approved",
    to: opts.to,
    recipientUserId: opts.talentId,
    email: talentApprovedEmail({
      firstName: opts.firstName,
      dashboardUrl: siteUrl("/dashboard/talent"),
    }),
  });
}

export function sendTalentRejected(opts: {
  to: string | null;
  firstName: string | null;
  talentId: string;
  fromStage: "pending_review" | "assessment_review" | "interview_review";
  reason?: string | null;
}): Promise<SendResult> {
  const stage =
    opts.fromStage === "assessment_review"
      ? "assessment"
      : opts.fromStage === "interview_review"
        ? "interview"
        : "application";
  return dispatchEmail({
    dedupeKey: `talent-rejected:${opts.talentId}:${opts.fromStage}`,
    category: "talent_rejected",
    to: opts.to,
    recipientUserId: opts.talentId,
    email: talentRejectedEmail({
      firstName: opts.firstName,
      reason: opts.reason,
      stage,
    }),
  });
}

export function sendProjectStartedClient(opts: {
  to: string | null;
  firstName: string | null;
  projectId: string;
  projectTitle: string;
  depositZar: string;
  clientId?: string;
}): Promise<SendResult> {
  return dispatchEmail({
    dedupeKey: `project-started-client:${opts.projectId}`,
    category: "project_started_client",
    to: opts.to,
    recipientUserId: opts.clientId,
    email: projectStartedClientEmail({
      firstName: opts.firstName,
      projectTitle: opts.projectTitle,
      depositZar: opts.depositZar,
      dashboardUrl: siteUrl(
        `/dashboard/client/projects?started=${opts.projectId}`
      ),
    }),
  });
}

export function sendProjectAssignmentTalent(opts: {
  to: string | null;
  firstName: string | null;
  projectId?: string;
  talentId?: string;
  projectTitle: string;
  role: string;
}): Promise<SendResult> {
  return dispatchEmail({
    dedupeKey: `project-assignment:${eventPart(opts.projectId ?? opts.projectTitle)}:${eventPart(opts.talentId ?? opts.to)}`,
    category: "project_assignment_talent",
    to: opts.to,
    recipientUserId: opts.talentId,
    email: projectAssignmentTalentEmail({
      firstName: opts.firstName,
      projectTitle: opts.projectTitle,
      role: opts.role,
      dashboardUrl: siteUrl("/dashboard/talent"),
    }),
  });
}

export function sendProjectFundedAdmin(opts: {
  to: string | null;
  projectId: string;
  projectTitle: string;
  companyName: string | null;
  depositZar: string;
  invoiceNumber: string | null;
  teamSummary: string;
  needsStaffingAttention: boolean;
}): Promise<SendResult> {
  return dispatchEmail({
    dedupeKey: `project-funded-admin:${opts.projectId}:${eventPart(opts.to)}`,
    category: "project_funded_admin",
    to: opts.to,
    email: projectFundedAdminEmail({
      projectTitle: opts.projectTitle,
      companyName: opts.companyName,
      depositZar: opts.depositZar,
      invoiceNumber: opts.invoiceNumber,
      teamSummary: opts.teamSummary,
      needsStaffingAttention: opts.needsStaffingAttention,
      adminUrl: siteUrl(`/admin/projects/${opts.projectId}`),
    }),
  });
}

export function sendProjectPaymentClient(opts: {
  to: string | null;
  firstName: string | null;
  clientId: string;
  projectId: string;
  paymentId: string;
  projectTitle: string;
  paymentLabel: string;
  paidAmount: string;
  baseAmount: string;
  invoiceNumber: string | null;
}): Promise<SendResult> {
  return dispatchEmail({
    dedupeKey: `project-payment-client:${opts.paymentId}`,
    category: "project_payment_client",
    to: opts.to,
    recipientUserId: opts.clientId,
    email: projectPaymentClientEmail({
      firstName: opts.firstName,
      projectTitle: opts.projectTitle,
      paymentLabel: opts.paymentLabel,
      paidAmount: opts.paidAmount,
      baseAmount: opts.baseAmount,
      invoiceNumber: opts.invoiceNumber,
      dashboardUrl: siteUrl(`/dashboard/client/projects/${opts.projectId}`),
    }),
  });
}

export function sendProjectEarningsTalent(opts: {
  to: string | null;
  firstName: string | null;
  talentId: string;
  projectId: string;
  paymentId: string;
  projectTitle: string;
  paymentLabel: string;
  allocationAmount: string;
  preferredCurrency: string;
}): Promise<SendResult> {
  return dispatchEmail({
    dedupeKey: `project-earnings-talent:${opts.paymentId}:${opts.talentId}`,
    category: "project_earnings_talent",
    to: opts.to,
    recipientUserId: opts.talentId,
    email: projectEarningsTalentEmail({
      firstName: opts.firstName,
      projectTitle: opts.projectTitle,
      paymentLabel: opts.paymentLabel,
      allocationAmount: opts.allocationAmount,
      preferredCurrency: opts.preferredCurrency,
      dashboardUrl: siteUrl("/dashboard/talent/payments"),
    }),
  });
}

export function sendProjectPaymentAdmin(opts: {
  to: string | null;
  projectId: string;
  paymentId: string;
  projectTitle: string;
  paymentLabel: string;
  paidAmount: string;
  baseAmount: string;
  invoiceNumber: string | null;
}): Promise<SendResult> {
  return dispatchEmail({
    dedupeKey: `project-payment-admin:${opts.paymentId}:${eventPart(opts.to)}`,
    category: "project_payment_admin",
    to: opts.to,
    email: projectPaymentAdminEmail({
      projectTitle: opts.projectTitle,
      paymentLabel: opts.paymentLabel,
      paidAmount: opts.paidAmount,
      baseAmount: opts.baseAmount,
      invoiceNumber: opts.invoiceNumber,
      projectUrl: siteUrl(`/admin/projects/${opts.projectId}/workspace`),
    }),
  });
}

export function sendTalentPayout(opts: {
  to: string | null;
  firstName: string | null;
  talentId: string;
  projectId: string;
  earningId: string;
  projectTitle: string;
  payoutAmount: string;
  baseAmount: string;
  reference: string;
}): Promise<SendResult> {
  return dispatchEmail({
    dedupeKey: `talent-payout:${opts.earningId}`,
    category: "talent_payout",
    to: opts.to,
    recipientUserId: opts.talentId,
    email: talentPayoutEmail({
      firstName: opts.firstName,
      projectTitle: opts.projectTitle,
      payoutAmount: opts.payoutAmount,
      baseAmount: opts.baseAmount,
      reference: opts.reference,
      dashboardUrl: siteUrl("/dashboard/talent/payments"),
    }),
  });
}

export function sendTalentPayoutAdmin(opts: {
  to: string | null;
  projectId: string;
  earningId: string;
  talentName: string;
  projectTitle: string;
  payoutAmount: string;
  baseAmount: string;
  reference: string;
}): Promise<SendResult> {
  return dispatchEmail({
    dedupeKey: `talent-payout-admin:${opts.earningId}:${eventPart(opts.to)}`,
    category: "talent_payout_admin",
    to: opts.to,
    email: talentPayoutAdminEmail({
      talentName: opts.talentName,
      projectTitle: opts.projectTitle,
      payoutAmount: opts.payoutAmount,
      baseAmount: opts.baseAmount,
      reference: opts.reference,
      projectUrl: siteUrl(`/admin/projects/${opts.projectId}/workspace`),
    }),
  });
}
