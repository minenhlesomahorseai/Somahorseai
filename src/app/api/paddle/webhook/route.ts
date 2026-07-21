import { EventName } from "@paddle/paddle-node-sdk";
import { NextResponse } from "next/server";

import { unmarshalPaddleWebhook } from "@/lib/payments/paddle";
import { activateCompletedTransaction } from "@/lib/projects/activation";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("paddle-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Paddle signature" }, { status: 400 });
  }

  const rawBody = await request.text();
  try {
    const event = await unmarshalPaddleWebhook(rawBody, signature);
    if (event.eventType === EventName.TransactionCompleted) {
      await activateCompletedTransaction({
        transaction: event.data,
        eventId: event.eventId,
        eventType: event.eventType,
        occurredAt: event.occurredAt,
      });
    } else if (
      event.eventType === EventName.TransactionPaymentFailed ||
      event.eventType === EventName.TransactionPastDue
    ) {
      const transaction = event.data as { id?: string };
      if (transaction.id) {
        const admin = createAdminClient();
        if (admin) {
          await Promise.all([
            admin
              .from("projects")
              .update({ payment_status: "failed" })
              .eq("paddle_transaction_id", transaction.id)
              .eq("payment_status", "pending"),
            admin
              .from("payments")
              .update({ status: "failed" })
              .eq("provider_transaction_id", transaction.id)
              .eq("status", "pending"),
          ]);
        }
      }
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Rejected Paddle webhook", error);
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }
}

