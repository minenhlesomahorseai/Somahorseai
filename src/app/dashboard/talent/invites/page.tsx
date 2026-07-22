import { CalendarClock, CheckCircle2, MailQuestion, ShieldCheck, Sparkles } from "lucide-react";

import { TalentEmptyState, TalentGlassCard, TalentPageHeader } from "@/components/dashboard/talent-ui";
import {
  fetchTalentInvitations,
  getInvitationProject,
  loadTalentSession,
} from "@/lib/dashboard/talent";
import { createClient } from "@/lib/supabase/server";

export default async function TalentInvitesPage() {
  const { userId, talent } = await loadTalentSession();
  const supabase = await createClient();
  const invitations = await fetchTalentInvitations(supabase, userId);

  return (
    <div className="space-y-6">
      <TalentPageHeader
        eyebrow="Opportunities"
        title="Project invites"
        description="Review funded opportunities where your skills and experience are a strong match."
        action={
          <div className="talent-glass flex items-center gap-3 rounded-2xl px-4 py-3">
            <span className="grid size-9 place-items-center rounded-xl bg-blue-vivid/10 text-blue-vivid">
              <MailQuestion className="size-4" aria-hidden />
            </span>
            <div>
              <p className="font-display text-xl font-bold leading-none text-navy">{invitations.length}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Open invites</p>
            </div>
          </div>
        }
      />

      {invitations.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {invitations.map((invitation) => {
            const project = getInvitationProject(invitation);
            return (
              <TalentGlassCard key={invitation.id} className="talent-card-enter relative overflow-hidden">
                <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-[4rem] bg-blue-vivid/5" />
                <div className="relative">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-teal/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-accent-teal">
                        <Sparkles className="size-3" aria-hidden /> New match
                      </span>
                      <h2 className="mt-3 font-display text-xl font-bold text-navy">{project?.title ?? "Somahorse project"}</h2>
                      <p className="mt-1 text-xs font-bold text-blue-vivid">{invitation.role}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-2xl font-bold text-navy">{invitation.match_score}%</p>
                      <p className="text-[10px] font-semibold text-muted-foreground">match</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    {project?.summary ?? invitation.reason ?? "The matching team identified your profile as a strong fit for this opportunity."}
                  </p>
                  {invitation.reason && project?.summary ? (
                    <div className="mt-4 rounded-2xl bg-white/55 p-3.5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-blue-vivid">Why you match</p>
                      <p className="mt-1 text-xs leading-5 text-navy-mid">{invitation.reason}</p>
                    </div>
                  ) : null}
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    {project?.timeline_weeks ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-light/70 px-3 py-1.5 text-xs font-semibold text-navy-mid">
                        <CalendarClock className="size-3.5" aria-hidden /> {project.timeline_weeks} weeks
                      </span>
                    ) : null}
                    {project?.solution_type ? (
                      <span className="rounded-full bg-blue-light/70 px-3 py-1.5 text-xs font-semibold capitalize text-navy-mid">
                        {project.solution_type.replaceAll("_", " ")}
                      </span>
                    ) : null}
                    <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-accent-teal/15 bg-white/65 px-3 py-1.5 text-xs font-semibold text-accent-teal">
                      <ShieldCheck className="size-3.5" aria-hidden /> Funding verified first
                    </span>
                  </div>
                </div>
              </TalentGlassCard>
            );
          })}
        </div>
      ) : (
        <TalentEmptyState
          icon={MailQuestion}
          title={talent.stage === "approved" ? "No open invites right now" : "Invites unlock after certification"}
          description={
            talent.stage === "approved"
              ? "Your profile is in the matching pool. When a funded project fits your skills, the opportunity will appear here and in notifications."
              : "Continue your certification journey. Once approved, the Matching Agent can nominate you for funded projects."
          }
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-accent-teal/10 px-4 py-2 text-xs font-bold text-accent-teal">
            <CheckCircle2 className="size-4" aria-hidden /> No action needed
          </span>
        </TalentEmptyState>
      )}

      <TalentGlassCard>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["1", "Matched", "The agent compares the project to your verified profile."],
            ["2", "Funding checked", "Projects are confirmed before talent is committed."],
            ["3", "Kickoff", "Accepted assignments move into your Projects workspace."],
          ].map(([number, title, description]) => (
            <div key={number} className="rounded-2xl bg-white/45 p-4">
              <span className="grid size-7 place-items-center rounded-full bg-navy text-xs font-bold text-white">{number}</span>
              <p className="mt-3 text-sm font-bold text-navy">{title}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </TalentGlassCard>
    </div>
  );
}
