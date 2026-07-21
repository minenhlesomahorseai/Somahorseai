import { NextResponse } from "next/server";

import { isAdminUser } from "@/lib/auth/admin";
import { getPaddleInvoiceUrl } from "@/lib/payments/paddle";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const projectId = new URL(request.url).searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "Missing project" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: project } = await supabase
    .from("projects")
    .select("client_id, paddle_transaction_id, payment_status")
    .eq("id", projectId)
    .maybeSingle();

  const canAccess = project?.client_id === user.id || (await isAdminUser(supabase, user));
  if (!canAccess) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
  if (!project?.paddle_transaction_id || project.payment_status !== "paid") {
    return NextResponse.json({ error: "Invoice is not available yet" }, { status: 404 });
  }

  try {
    const invoiceUrl = await getPaddleInvoiceUrl(project.paddle_transaction_id);
    return NextResponse.redirect(invoiceUrl);
  } catch (error) {
    console.error("Could not load Paddle invoice", error);
    return NextResponse.json({ error: "Could not load the invoice" }, { status: 502 });
  }
}
