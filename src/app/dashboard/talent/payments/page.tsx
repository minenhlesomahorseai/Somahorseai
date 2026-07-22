import { CalendarDays, CircleDollarSign, Landmark, LockKeyhole, ReceiptText } from "lucide-react";

import { PreviewPill, TalentGlassCard, TalentPageHeader, TalentSectionTitle } from "@/components/dashboard/talent-ui";
import { fetchTalentProjects, loadTalentSession } from "@/lib/dashboard/talent";
import { createClient } from "@/lib/supabase/server";

export default async function TalentPaymentsPage() {
  await loadTalentSession();
  const supabase = await createClient();
  const projects = await fetchTalentProjects(supabase);
  const activeProjects = projects.filter((project) => ["assigned", "active"].includes(project.assignment_status));

  return (
    <div className="space-y-6">
      <TalentPageHeader
        eyebrow="Earnings"
        title="Payments"
        description="A clear home for milestone earnings, payout schedules, and payment history."
        action={<PreviewPill />}
      />

      <div className="grid gap-4 lg:grid-cols-12">
        <section className="talent-glass-dark relative overflow-hidden rounded-[2rem] p-6 text-white sm:p-8 lg:col-span-7">
          <div className="absolute -right-14 -top-14 size-48 rounded-full bg-white/8 blur-xl" />
          <div className="relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-white/55">Available balance</p>
                <p className="mt-3 font-display text-4xl font-bold">R0.00</p>
                <p className="mt-1 text-xs text-white/50">No released milestones yet</p>
              </div>
              <span className="grid size-12 place-items-center rounded-2xl border border-white/15 bg-white/10">
                <CircleDollarSign className="size-6" aria-hidden />
              </span>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/8 p-3.5 backdrop-blur-xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/45">Pending</p>
                <p className="mt-1 font-display text-lg font-bold">R0.00</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/8 p-3.5 backdrop-blur-xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/45">Paid to date</p>
                <p className="mt-1 font-display text-lg font-bold">R0.00</p>
              </div>
            </div>
          </div>
        </section>

        <TalentGlassCard className="lg:col-span-5">
          <TalentSectionTitle title="Payout setup" icon={Landmark} />
          <div className="rounded-2xl border border-dashed border-blue-vivid/20 bg-white/45 p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-blue-vivid/10 text-blue-vivid">
                <LockKeyhole className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-bold text-navy">Secure payout details</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Bank and wallet setup is coming next.</p>
              </div>
            </div>
            <button type="button" disabled className="mt-5 w-full rounded-xl bg-navy/8 px-4 py-3 text-xs font-bold text-navy/40">
              Connect payout method
            </button>
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">Payment details will be encrypted and kept separate from your public talent profile.</p>
        </TalentGlassCard>

        <TalentGlassCard className="lg:col-span-12">
          <TalentSectionTitle title="Upcoming milestones" icon={CalendarDays} />
          {activeProjects.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {activeProjects.map((project) => (
                <div key={project.project_id} className="rounded-2xl bg-white/50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-navy">{project.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Milestone schedule is being prepared</p>
                    </div>
                    <PreviewPill />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-white/35 px-5 py-9 text-center">
              <ReceiptText className="size-6 text-blue-vivid/45" aria-hidden />
              <p className="mt-3 text-sm font-bold text-navy">No payout activity yet</p>
              <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">Milestone schedules will populate here when an assignment begins.</p>
            </div>
          )}
        </TalentGlassCard>
      </div>
    </div>
  );
}
