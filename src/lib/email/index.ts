import { Resend } from "resend";

import { siteUrl } from "@/lib/site";

import { CLIENT_WELCOME_MD, HOW_IT_WORKS_MD } from "./assets";
import {
  assessmentInviteEmail,
  clientWelcomeEmail,
  talentPassedEmail,
  talentRejectedEmail,
  talentWelcomeEmail,
  type BuiltEmail,
} from "./templates";

const DEFAULT_FROM = "Somahorse.ai <onboarding@resend.dev>";

function fromAddress(): string {
  const envFrom = process.env.EMAIL_FROM;
  if (!envFrom) return DEFAULT_FROM;
  if (envFrom.includes("@")) return envFrom;
  return `${envFrom} <onboarding@resend.dev>`;
}

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

let client: Resend | null = null;
function resend(): Resend | null {
  if (!emailConfigured()) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

interface Attachment {
  filename: string;
  content: Buffer;
}

export interface SendResult {
  sent: boolean;
  skipped?: boolean;
  error?: string;
}

/**
 * Sends an email and never throws — transactional email must never break the
 * signup or admin flow that triggers it. Failures are logged and returned.
 */
async function send(
  to: string | null | undefined,
  email: BuiltEmail,
  attachments?: Attachment[]
): Promise<SendResult> {
  if (!to) return { sent: false, error: "No recipient address" };

  const api = resend();
  if (!api) {
    console.warn(
      `[email] RESEND_API_KEY not set — skipped "${email.subject}" to ${to}`
    );
    return { sent: false, skipped: true };
  }

  try {
    const { error } = await api.emails.send({
      from: fromAddress(),
      to,
      subject: email.subject,
      html: email.html,
      attachments: attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
      })),
    });
    if (error) {
      console.error(`[email] send failed for "${email.subject}":`, error);
      return { sent: false, error: error.message };
    }
    return { sent: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown email error";
    console.error(`[email] send threw for "${email.subject}":`, message);
    return { sent: false, error: message };
  }
}

export function sendClientWelcome(opts: {
  to: string | null;
  firstName: string | null;
}): Promise<SendResult> {
  return send(
    opts.to,
    clientWelcomeEmail({
      firstName: opts.firstName,
      dashboardUrl: siteUrl("/dashboard/client"),
    }),
    [
      { filename: "welcome-to-somahorse.md", content: Buffer.from(CLIENT_WELCOME_MD, "utf8") },
      { filename: "how-somahorse-works.md", content: Buffer.from(HOW_IT_WORKS_MD, "utf8") },
    ]
  );
}

export function sendTalentWelcome(opts: {
  to: string | null;
  firstName: string | null;
}): Promise<SendResult> {
  return send(
    opts.to,
    talentWelcomeEmail({
      firstName: opts.firstName,
      statusUrl: siteUrl("/onboarding/talent"),
    })
  );
}

export function sendAssessmentInvite(opts: {
  to: string | null;
  firstName: string | null;
  assessmentToken: string;
  timeLimitMinutes: number;
}): Promise<SendResult> {
  return send(
    opts.to,
    assessmentInviteEmail({
      firstName: opts.firstName,
      assessmentUrl: siteUrl(`/assessment/${opts.assessmentToken}`),
      timeLimitMinutes: opts.timeLimitMinutes,
    })
  );
}

export function sendTalentPassed(opts: {
  to: string | null;
  firstName: string | null;
  notes?: string | null;
}): Promise<SendResult> {
  return send(
    opts.to,
    talentPassedEmail({
      firstName: opts.firstName,
      statusUrl: siteUrl("/onboarding/talent"),
      notes: opts.notes,
    })
  );
}

export function sendTalentRejected(opts: {
  to: string | null;
  firstName: string | null;
  reason?: string | null;
}): Promise<SendResult> {
  return send(
    opts.to,
    talentRejectedEmail({ firstName: opts.firstName, reason: opts.reason })
  );
}
