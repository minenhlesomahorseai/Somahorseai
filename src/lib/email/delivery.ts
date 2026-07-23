import { Resend } from "resend";

import type { BuiltEmail } from "@/lib/email/templates";
import { createAdminClient } from "@/lib/supabase/admin";

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

interface StoredAttachment {
  filename: string;
  contentBase64: string;
  contentType?: string;
}

export interface SendResult {
  sent: boolean;
  queued: boolean;
  skipped?: boolean;
  alreadySent?: boolean;
  deliveryId?: string;
  providerMessageId?: string;
  error?: string;
}

export interface EmailHealth {
  configured: boolean;
  apiKeyConfigured: boolean;
  fromConfigured: boolean;
  sender: string | null;
  senderDomain: string | null;
  domainVerified: boolean;
  message: string;
}

interface DispatchOptions {
  dedupeKey: string;
  category: string;
  to: string | null | undefined;
  recipientUserId?: string | null;
  email: BuiltEmail;
  attachments?: EmailAttachment[];
}

interface DeliveryRow {
  id: string;
  status: "pending" | "sending" | "sent" | "failed" | "cancelled";
  recipient_email: string;
  subject: string;
  html_body: string;
  text_body: string;
  attachments: StoredAttachment[];
  attempt_count: number;
  category: string;
  dedupe_key: string;
}

let client: Resend | null = null;

function resendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

function fromAddress(): string | null {
  const value = process.env.EMAIL_FROM?.trim();
  return value || null;
}

function replyToAddress(): string | undefined {
  return process.env.EMAIL_REPLY_TO?.trim() || undefined;
}

function providerConfigurationError(): string | null {
  if (!process.env.RESEND_API_KEY) {
    return "RESEND_API_KEY is not configured";
  }
  if (!fromAddress()) {
    return "EMAIL_FROM is not configured. Verify a sending domain in Resend, then set EMAIL_FROM.";
  }
  return null;
}

function storedAttachments(
  attachments: EmailAttachment[] | undefined
): StoredAttachment[] {
  return (attachments ?? []).map((attachment) => ({
    filename: attachment.filename,
    contentBase64: attachment.content.toString("base64"),
    ...(attachment.contentType
      ? { contentType: attachment.contentType }
      : {}),
  }));
}

function restoredAttachments(
  attachments: StoredAttachment[] | null | undefined
): EmailAttachment[] {
  return (attachments ?? []).map((attachment) => ({
    filename: attachment.filename,
    content: Buffer.from(attachment.contentBase64, "base64"),
    ...(attachment.contentType
      ? { contentType: attachment.contentType }
      : {}),
  }));
}

function safeError(error: unknown): string {
  if (error instanceof Error) return error.message.slice(0, 1000);
  return String(error || "Unknown email error").slice(0, 1000);
}

function nextAttempt(attemptCount: number): string {
  const minutes = Math.min(6 * 60, 2 ** Math.max(0, attemptCount - 1) * 5);
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

async function sendToProvider(
  to: string,
  email: BuiltEmail,
  attachments?: EmailAttachment[]
): Promise<{ id: string }> {
  const api = resendClient();
  const from = fromAddress();
  if (!api) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  if (!from) {
    throw new Error(
      "EMAIL_FROM is not configured. Verify a sending domain in Resend, then set EMAIL_FROM."
    );
  }

  const { data, error } = await api.emails.send({
    from,
    to,
    subject: email.subject,
    html: email.html,
    text: email.text,
    ...(replyToAddress() ? { replyTo: replyToAddress() } : {}),
    ...(attachments?.length
      ? {
          attachments: attachments.map((attachment) => ({
            filename: attachment.filename,
            content: attachment.content,
            ...(attachment.contentType
              ? { contentType: attachment.contentType }
              : {}),
          })),
        }
      : {}),
  });

  if (error) throw new Error(error.message);
  if (!data?.id) throw new Error("Email provider returned no message id");
  return { id: data.id };
}

/**
 * Stores the message before attempting delivery, then immediately tries to
 * send it. The stable dedupe key makes repeated workflow actions idempotent.
 */
export async function dispatchEmail(
  options: DispatchOptions
): Promise<SendResult> {
  const to = options.to?.trim().toLowerCase();
  if (!to) {
    return {
      sent: false,
      queued: false,
      skipped: true,
      error: "No recipient email address",
    };
  }

  const admin = createAdminClient();
  if (!admin) {
    try {
      const result = await sendToProvider(to, options.email, options.attachments);
      return {
        sent: true,
        queued: false,
        providerMessageId: result.id,
      };
    } catch (error) {
      return {
        sent: false,
        queued: false,
        error: safeError(error),
      };
    }
  }

  const { error: queueError } = await admin.from("email_deliveries").upsert(
    {
      dedupe_key: options.dedupeKey,
      category: options.category,
      recipient_user_id: options.recipientUserId ?? null,
      recipient_email: to,
      subject: options.email.subject,
      html_body: options.email.html,
      text_body: options.email.text,
      attachments: storedAttachments(options.attachments),
      status: "pending",
      next_attempt_at: new Date().toISOString(),
    },
    { onConflict: "dedupe_key", ignoreDuplicates: true }
  );

  if (queueError) {
    // Keep existing deployments functional while migration 013 is being
    // applied, but return the provider failure instead of silently swallowing.
    console.warn("[email] Could not persist delivery:", queueError.message);
    try {
      const result = await sendToProvider(to, options.email, options.attachments);
      return {
        sent: true,
        queued: false,
        providerMessageId: result.id,
      };
    } catch (error) {
      return {
        sent: false,
        queued: false,
        error: `${queueError.message}; ${safeError(error)}`,
      };
    }
  }

  const { data: delivery, error: loadError } = await admin
    .from("email_deliveries")
    .select(
      "id, status, recipient_email, subject, html_body, text_body, attachments, attempt_count, category, dedupe_key"
    )
    .eq("dedupe_key", options.dedupeKey)
    .single();

  if (loadError || !delivery) {
    return {
      sent: false,
      queued: true,
      error: loadError?.message ?? "Queued email could not be loaded",
    };
  }

  if (delivery.status === "sent") {
    return {
      sent: true,
      queued: true,
      alreadySent: true,
      deliveryId: delivery.id,
    };
  }

  return deliverEmailDelivery(delivery.id);
}

export async function deliverEmailDelivery(
  deliveryId: string
): Promise<SendResult> {
  const admin = createAdminClient();
  if (!admin) {
    return {
      sent: false,
      queued: false,
      error: "SUPABASE_SERVICE_ROLE_KEY is not configured",
    };
  }

  const configurationError = providerConfigurationError();
  if (configurationError) {
    await admin
      .from("email_deliveries")
      .update({
        status: "pending",
        last_error: configurationError,
        next_attempt_at: new Date(Date.now() + 60 * 60_000).toISOString(),
        locked_at: null,
      })
      .eq("id", deliveryId)
      .neq("status", "sent");
    return {
      sent: false,
      queued: true,
      deliveryId,
      error: configurationError,
    };
  }

  const lockedAt = new Date().toISOString();
  const { data: claimed, error: claimError } = await admin
    .from("email_deliveries")
    .update({ status: "sending", locked_at: lockedAt })
    .eq("id", deliveryId)
    .in("status", ["pending", "failed"])
    .lte("next_attempt_at", lockedAt)
    .select(
      "id, status, recipient_email, subject, html_body, text_body, attachments, attempt_count, category, dedupe_key"
    )
    .maybeSingle();

  if (claimError) {
    return {
      sent: false,
      queued: true,
      deliveryId,
      error: claimError.message,
    };
  }

  if (!claimed) {
    const { data: current } = await admin
      .from("email_deliveries")
      .select("status, provider_message_id")
      .eq("id", deliveryId)
      .maybeSingle();
    return {
      sent: current?.status === "sent",
      queued: true,
      alreadySent: current?.status === "sent",
      deliveryId,
      providerMessageId: current?.provider_message_id ?? undefined,
      ...(!current
        ? { error: "Email delivery record no longer exists" }
        : current.status === "failed"
          ? { error: "Email is waiting for its next retry window" }
          : {}),
    };
  }

  const row = claimed as DeliveryRow;
  const email: BuiltEmail = {
    subject: row.subject,
    html: row.html_body,
    text: row.text_body,
  };
  const attemptCount = row.attempt_count + 1;

  try {
    const result = await sendToProvider(
      row.recipient_email,
      email,
      restoredAttachments(row.attachments)
    );
    await admin
      .from("email_deliveries")
      .update({
        status: "sent",
        provider_message_id: result.id,
        provider_status: "accepted",
        attempt_count: attemptCount,
        last_error: null,
        locked_at: null,
        sent_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    return {
      sent: true,
      queued: true,
      deliveryId: row.id,
      providerMessageId: result.id,
    };
  } catch (error) {
    const message = safeError(error);
    await admin
      .from("email_deliveries")
      .update({
        status: "failed",
        attempt_count: attemptCount,
        last_error: message,
        next_attempt_at: nextAttempt(attemptCount),
        locked_at: null,
      })
      .eq("id", row.id);

    console.warn(
      `[email] Delivery ${row.id} failed on attempt ${attemptCount}: ${message}`
    );
    return {
      sent: false,
      queued: true,
      deliveryId: row.id,
      error: message,
    };
  }
}

export async function processPendingEmails(limit = 25): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  const admin = createAdminClient();
  if (!admin) return { processed: 0, sent: 0, failed: 0 };

  const now = new Date();
  const staleLock = new Date(now.getTime() - 10 * 60_000).toISOString();
  await admin
    .from("email_deliveries")
    .update({
      status: "pending",
      locked_at: null,
      next_attempt_at: now.toISOString(),
      last_error: "Recovered a stale delivery lock",
    })
    .eq("status", "sending")
    .lt("locked_at", staleLock);

  const { data, error } = await admin
    .from("email_deliveries")
    .select("id")
    .in("status", ["pending", "failed"])
    .lte("next_attempt_at", now.toISOString())
    .order("created_at", { ascending: true })
    .limit(Math.max(1, Math.min(limit, 100)));

  if (error || !data) return { processed: 0, sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;
  for (const row of data) {
    const result = await deliverEmailDelivery(row.id);
    if (result.sent) sent += 1;
    else failed += 1;
  }
  return { processed: data.length, sent, failed };
}

export async function retryFailedEmails(): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  const admin = createAdminClient();
  if (!admin) return { processed: 0, sent: 0, failed: 0 };
  await admin
    .from("email_deliveries")
    .update({ next_attempt_at: new Date().toISOString() })
    .eq("status", "failed");
  return processPendingEmails(100);
}

export async function retryEmailDelivery(
  deliveryId: string
): Promise<SendResult> {
  const admin = createAdminClient();
  if (!admin) {
    return {
      sent: false,
      queued: false,
      error: "Email delivery storage is not configured",
    };
  }
  const { data } = await admin
    .from("email_deliveries")
    .select("status")
    .eq("id", deliveryId)
    .maybeSingle();
  if (!data || !["failed", "pending"].includes(data.status)) {
    return {
      sent: false,
      queued: false,
      deliveryId,
      error: "Only failed or pending deliveries can be retried",
    };
  }
  await admin
    .from("email_deliveries")
    .update({
      status: "pending",
      next_attempt_at: new Date().toISOString(),
      locked_at: null,
    })
    .eq("id", deliveryId);
  return deliverEmailDelivery(deliveryId);
}

export async function getEmailHealth(): Promise<EmailHealth> {
  const api = resendClient();
  const sender = fromAddress();
  const domainMatch = sender?.match(/@([^>\s]+)>?$/);
  const senderDomain = domainMatch?.[1]?.toLowerCase() ?? null;

  if (!api) {
    return {
      configured: false,
      apiKeyConfigured: false,
      fromConfigured: Boolean(sender),
      sender,
      senderDomain,
      domainVerified: false,
      message: "Add RESEND_API_KEY to enable transactional email.",
    };
  }
  if (!sender || !senderDomain) {
    return {
      configured: false,
      apiKeyConfigured: true,
      fromConfigured: false,
      sender,
      senderDomain,
      domainVerified: false,
      message:
        "Verify a sending domain in Resend, then set EMAIL_FROM to an address on that domain.",
    };
  }

  try {
    const response = await api.domains.list();
    const domains = response.data?.data ?? [];
    const domain = domains.find(
      (item) =>
        item.name.toLowerCase() === senderDomain ||
        senderDomain.endsWith(`.${item.name.toLowerCase()}`)
    );
    const verified = domain?.status === "verified";
    return {
      configured: verified,
      apiKeyConfigured: true,
      fromConfigured: true,
      sender,
      senderDomain,
      domainVerified: verified,
      message: verified
        ? `Email delivery is active from ${sender}.`
        : `${senderDomain} is not verified in Resend. Messages will remain queued until it is verified.`,
    };
  } catch {
    return {
      configured: false,
      apiKeyConfigured: true,
      fromConfigured: true,
      sender,
      senderDomain,
      domainVerified: false,
      message:
        "The Resend configuration could not be verified. Check the API key and sending domain.",
    };
  }
}
