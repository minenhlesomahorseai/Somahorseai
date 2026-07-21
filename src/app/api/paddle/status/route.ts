import { NextResponse } from "next/server";

import { getPaddleTransaction, paddleApiConfigured } from "@/lib/payments/paddle";
import { activateCompletedTransaction } from "@/lib/projects/activation";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let projectId = "";
  try {
    const body = (await request.json()) as { projectId?: string };
    projectId = body.projectId?.trim() ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
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
    .select("id, status, payment_status, paddle_transaction_id")
    .eq("id", projectId)
    .eq("client_id", user.id)
    .maybeSingle();
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  if (project.payment_status === "paid") {
    return NextResponse.json({ paid: true, projectStatus: project.status });
  }
  if (!project.paddle_transaction_id || !paddleApiConfigured()) {
    return NextResponse.json({ paid: false, projectStatus: project.status });
  }

  try {
    const transaction = await getPaddleTransaction(project.paddle_transaction_id);
    if (transaction.status !== "completed") {
      return NextResponse.json({
        paid: false,
        processing: transaction.status === "paid",
        projectStatus: project.status,
      });
    }

    const activation = await activateCompletedTransaction({
      transaction,
      eventId: `checkout-sync:${transaction.id}`,
      eventType: "transaction.completed.sync",
      occurredAt: transaction.updatedAt,
    });
    return NextResponse.json({
      paid: true,
      projectStatus: activation.project_status,
    });
  } catch (error) {
    console.error("Could not confirm Paddle transaction", error);
    return NextResponse.json(
      { error: "Payment is still being confirmed. Your project will update automatically." },
      { status: 502 }
    );
  }
}

