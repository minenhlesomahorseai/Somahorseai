"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Trophy, XCircle } from "lucide-react";

import { setTalentStage } from "@/app/admin/actions";

export function AssessmentDecision({
  talentId,
  initialNotes,
}: {
  talentId: string;
  initialNotes: string;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [mode, setMode] = useState<"idle" | "rejecting">("idle");
  const [error, setError] = useState("");
  const [done, setDone] = useState<"interview" | "rejected" | null>(null);
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const act = (nextStage: "interview" | "rejected") => {
    setError("");
    if (nextStage === "rejected" && !notes.trim()) {
      setMode("rejecting");
      setError("Add a short reason — it's included in the rejection email.");
      return;
    }
    startTransition(async () => {
      try {
        const result = await setTalentStage(
          talentId,
          "assessment_review",
          nextStage,
          notes || undefined
        );
        setDeliveryMessage(
          result.email?.sent
            ? "The email was accepted for delivery."
            : result.email?.queued
              ? "The email is safely queued and will retry automatically."
              : "The stage was updated."
        );
        setDone(nextStage);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Action failed.");
      }
    });
  };

  if (done) {
    return (
      <div className="mt-8 rounded-2xl border border-accent-teal/30 bg-accent-teal/5 p-6 text-center">
        <CheckCircle2 className="mx-auto size-7 text-accent-teal" />
        <p className="mt-2 text-sm font-semibold text-navy">
          {done === "interview"
            ? "Promoted to interview scheduling."
            : "Application rejected with the reason recorded."}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{deliveryMessage}</p>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-2xl border border-border bg-white/85 p-6 shadow-card">
      <h2 className="font-display text-lg font-bold text-navy">Your decision</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Promote this candidate to the interview stage or reject them. Either way they
        receive an email. A rejection reason is required and shared with the applicant.
      </p>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        placeholder={
          mode === "rejecting"
            ? "Reason for rejection (sent to the applicant)…"
            : "Notes / reason (required for rejection)…"
        }
        className="mt-4 w-full rounded-xl border border-border-strong bg-white px-3 py-2.5 text-sm text-navy placeholder-muted-foreground/50 transition focus:border-blue-vivid focus:outline-none focus:ring-2 focus:ring-blue-vivid/10"
      />

      {error ? <p className="mt-2 text-xs font-medium text-accent-amber">{error}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => act("interview")}
          disabled={pending}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-navy-mid px-6 text-sm font-bold text-white shadow-glow transition hover:bg-navy disabled:opacity-50"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Trophy className="size-4" />}
          Pass → Interview
        </button>
        <button
          type="button"
          onClick={() => act("rejected")}
          disabled={pending}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border-strong bg-white px-6 text-sm font-bold text-muted-foreground transition hover:border-accent-amber/40 hover:text-accent-amber disabled:opacity-50"
        >
          <XCircle className="size-4" />
          Reject
        </button>
      </div>
    </div>
  );
}
