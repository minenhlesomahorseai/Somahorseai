import { NextResponse } from "next/server";

import { getPaddleTransaction, paddleApiConfigured } from "@/lib/payments/paddle";
import { reconcileCompletedTransaction } from "@/lib/projects/activation";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let paymentId = "";
  try {
    paymentId = String(((await request.json()) as { paymentId?: string }).paymentId ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!paymentId) return NextResponse.json({ error: "Missing payment" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: payment } = await supabase
    .from("payments")
    .select("id, project_id, status, provider_transaction_id")
    .eq("id", paymentId)
    .eq("client_id", user.id)
    .maybeSingle();
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  if (payment.status === "paid") return NextResponse.json({ paid: true, projectId: payment.project_id });
  if (!paddleApiConfigured()) return NextResponse.json({ paid: false, projectId: payment.project_id });

  try {
    const transaction = await getPaddleTransaction(payment.provider_transaction_id);
    if (transaction.status !== "completed") {
      return NextResponse.json({
        paid: false,
        processing: transaction.status === "paid",
        projectId: payment.project_id,
      });
    }
    await reconcileCompletedTransaction({
      transaction,
      eventId: `workspace-checkout-sync:${transaction.id}`,
      eventType: "transaction.completed.workspace_sync",
      occurredAt: transaction.updatedAt,
    });
    return NextResponse.json({ paid: true, projectId: payment.project_id });
  } catch (error) {
    console.error("Could not confirm workspace Paddle payment", error);
    return NextResponse.json(
      { error: "Payment is still being confirmed. The workspace will update automatically." },
      { status: 502 }
    );
  }
}
