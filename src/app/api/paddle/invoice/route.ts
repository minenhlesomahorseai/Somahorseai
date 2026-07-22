import { NextResponse } from "next/server";

import { isAdminUser } from "@/lib/auth/admin";
import { getPaddleInvoiceUrl } from "@/lib/payments/paddle";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const projectId = new URL(request.url).searchParams.get("projectId");
  const paymentId = new URL(request.url).searchParams.get("paymentId");
  if (!projectId && !paymentId) {
    return NextResponse.json({ error: "Missing project or payment" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let transactionId: string | null = null;
  let paid = false;
  let ownerId: string | null = null;
  if (paymentId) {
    const { data: payment } = await supabase
      .from("payments")
      .select("client_id, provider_transaction_id, status")
      .eq("id", paymentId)
      .maybeSingle();
    transactionId = payment?.provider_transaction_id ?? null;
    paid = payment?.status === "paid";
    ownerId = payment?.client_id ?? null;
  } else {
    const { data: project } = await supabase
      .from("projects")
      .select("client_id, paddle_transaction_id, payment_status")
      .eq("id", projectId)
      .maybeSingle();
    transactionId = project?.paddle_transaction_id ?? null;
    paid = project?.payment_status === "paid";
    ownerId = project?.client_id ?? null;
  }

  const canAccess = ownerId === user.id || (await isAdminUser(supabase, user));
  if (!canAccess) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (!transactionId || !paid) {
    return NextResponse.json({ error: "Invoice is not available yet" }, { status: 404 });
  }

  try {
    const invoiceUrl = await getPaddleInvoiceUrl(transactionId);
    return NextResponse.redirect(invoiceUrl);
  } catch (error) {
    console.error("Could not load Paddle invoice", error);
    return NextResponse.json({ error: "Could not load the invoice" }, { status: 502 });
  }
}
