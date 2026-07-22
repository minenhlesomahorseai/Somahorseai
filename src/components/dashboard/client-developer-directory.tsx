"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  Code2,
  ExternalLink,
  FolderKanban,
  MapPin,
  MessageCircle,
  Sprout,
  UsersRound,
  X,
} from "lucide-react";

import type { ClientDeveloper } from "@/lib/dashboard/client-workspace-data";
import { optionLabel, TALENT_ROLES } from "@/lib/onboarding/options";

const EASE = [0.16, 1, 0.3, 1] as const;

export function ClientDeveloperDirectory({ developers }: { developers: ClientDeveloper[] }) {
  const [selected, setSelected] = useState<ClientDeveloper | null>(null);

  useEffect(() => {
    if (!selected) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [selected]);

  if (!developers.length) {
    return (
      <div className="workspace-glass flex min-h-[25rem] flex-col items-center justify-center rounded-[2rem] px-6 text-center">
        <span className="grid size-16 place-items-center rounded-3xl bg-blue-vivid/10 text-blue-vivid"><UsersRound className="size-7" aria-hidden /></span>
        <h2 className="mt-5 font-display text-2xl font-bold text-navy">Your team will appear here</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Once certified talent is assigned to one of your projects, you&apos;ll be able to view their profile and message the project group here.</p>
        <Link href="/dashboard/client/projects" className="mt-6 inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-bold text-white shadow-glow">View projects <ArrowUpRight className="size-4" aria-hidden /></Link>
      </div>
    );
  }

  return (
    <>
      <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {developers.map((developer, index) => {
          const activeProject = developer.projects.find((project) => ["assigned", "active"].includes(project.assignmentStatus));
          const messageProject = activeProject ?? developer.projects[0];
          return (
            <motion.article
              key={developer.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.04, 0.24), duration: 0.35, ease: EASE }}
              className="group min-w-0 overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/72 shadow-card backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-elevated sm:rounded-[1.75rem]"
            >
              <button type="button" onClick={() => setSelected(developer)} className="block w-full text-left">
                <div className="relative aspect-[1.15/1] overflow-hidden bg-gradient-to-br from-navy via-navy-mid to-blue-vivid sm:aspect-[1.25/1]">
                  <span className="absolute -right-8 -top-10 size-28 rounded-full border border-white/10 bg-white/5" />
                  <span className="absolute -bottom-14 -left-8 size-36 rounded-full bg-accent-teal/18 blur-xl" />
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="grid size-16 place-items-center rounded-full border border-white/20 bg-white/12 font-display text-2xl font-bold text-white shadow-glow backdrop-blur-md sm:size-20 sm:text-3xl">
                      {initials(developer.fullName)}
                    </span>
                  </span>
                  <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white/14 px-2 py-1 text-[8px] font-bold text-white backdrop-blur-md sm:left-3 sm:top-3 sm:text-[9px]">
                    <BadgeCheck className="size-3 text-accent-teal" aria-hidden /> Certified
                  </span>
                  <span className={`absolute bottom-2.5 right-2.5 rounded-full px-2 py-1 text-[8px] font-bold backdrop-blur-md sm:bottom-3 sm:right-3 sm:text-[9px] ${activeProject ? "bg-accent-teal/90 text-white" : "bg-white/85 text-navy"}`}>
                    {activeProject ? "Working now" : "Past team"}
                  </span>
                </div>
                <div className="min-w-0 p-3 sm:p-4">
                  <h2 className="truncate font-display text-sm font-bold text-navy sm:text-base">{developer.fullName}</h2>
                  <p className="mt-0.5 truncate text-[10px] font-semibold text-blue-vivid sm:text-xs">{roleLabel(developer)}</p>
                  <div className="mt-2.5 flex items-center gap-1 text-[9px] text-muted-foreground sm:text-[11px]">
                    <FolderKanban className="size-3 shrink-0" aria-hidden />
                    <span className="truncate">{activeProject?.title ?? developer.projects[0]?.title ?? "Project team"}</span>
                  </div>
                  <div className="mt-2.5 hidden flex-wrap gap-1.5 sm:flex">
                    {developer.skills.slice(0, 3).map((skill) => <span key={skill} className="max-w-full truncate rounded-full bg-blue-light/65 px-2 py-1 text-[9px] font-bold text-navy-mid">{skill}</span>)}
                  </div>
                </div>
              </button>
              <div className="grid grid-cols-2 gap-1.5 border-t border-border/55 p-2 sm:p-3">
                <button type="button" onClick={() => setSelected(developer)} className="rounded-xl bg-blue-light/60 px-2 py-2 text-[9px] font-bold text-navy-mid transition hover:bg-blue-light sm:text-[11px]">Profile</button>
                {messageProject ? <Link href={`/dashboard/client/messages?project=${messageProject.id}`} className="inline-flex items-center justify-center gap-1 rounded-xl bg-navy px-2 py-2 text-[9px] font-bold text-white transition hover:bg-navy-mid sm:text-[11px]"><MessageCircle className="size-3" aria-hidden /><span className="hidden sm:inline">Message</span><span className="sm:hidden">Chat</span></Link> : null}
              </div>
            </motion.article>
          );
        })}
      </div>

      <AnimatePresence>
        {selected ? (
          <>
            <motion.button type="button" aria-label="Close profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)} className="fixed inset-0 z-50 bg-navy/45 backdrop-blur-sm" />
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-label={`${selected.fullName} profile`}
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ duration: 0.28, ease: EASE }}
              className="fixed inset-x-3 bottom-3 top-[max(0.75rem,env(safe-area-inset-top))] z-50 mx-auto flex max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-elevated sm:inset-x-6 sm:bottom-auto sm:top-1/2 sm:max-h-[88vh] sm:-translate-y-1/2"
            >
              <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-navy via-navy-mid to-blue-vivid px-5 pb-6 pt-5 text-white sm:px-7 sm:pb-8">
                <span className="absolute -right-10 -top-12 size-44 rounded-full border border-white/10 bg-white/5" />
                <button type="button" onClick={() => setSelected(null)} aria-label="Close" className="absolute right-4 top-4 z-10 grid size-9 place-items-center rounded-full bg-white/12 text-white backdrop-blur"><X className="size-4" aria-hidden /></button>
                <div className="relative flex items-end gap-4 pt-8">
                  <span className="grid size-20 shrink-0 place-items-center rounded-full border border-white/20 bg-white/12 font-display text-3xl font-bold shadow-glow backdrop-blur sm:size-24 sm:text-4xl">{initials(selected.fullName)}</span>
                  <div className="min-w-0 pb-1"><span className="inline-flex items-center gap-1 text-[10px] font-bold text-accent-teal"><BadgeCheck className="size-3.5" aria-hidden /> Somahorse certified</span><h2 className="mt-1 truncate font-display text-2xl font-bold sm:text-3xl">{selected.fullName}</h2><p className="mt-1 text-xs text-white/65 sm:text-sm">{selected.headline ?? roleLabel(selected)}</p></div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
                <div className="grid grid-cols-3 gap-2">
                  <ProfileMetric icon={BriefcaseBusiness} label="Experience" value={selected.yearsExperience ? `${selected.yearsExperience}+ years` : "Verified"} />
                  <ProfileMetric icon={MapPin} label="Based in" value={selected.country ?? "Remote"} />
                  <ProfileMetric icon={Sprout} label="Agri context" value={selected.agriExperience ? "Experienced" : "Certified"} />
                </div>
                <div className="mt-6"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-vivid">About</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{selected.bio ?? `${selected.fullName} is a certified ${roleLabel(selected).toLowerCase()} assigned through the Somahorse matching process.`}</p></div>
                {selected.skills.length ? <div className="mt-6"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-vivid">Skills</p><div className="mt-2 flex flex-wrap gap-2">{selected.skills.map((skill) => <span key={skill} className="rounded-full border border-border bg-blue-light/45 px-3 py-1.5 text-xs font-bold text-navy-mid">{skill}</span>)}</div></div> : null}
                <div className="mt-6"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-vivid">Projects with you</p><div className="mt-2 space-y-2">{selected.projects.map((project) => <div key={project.id} className="flex items-center justify-between gap-3 rounded-2xl bg-blue-light/40 p-3"><div className="min-w-0"><p className="truncate text-xs font-bold text-navy">{project.title}</p><p className="mt-0.5 text-[10px] capitalize text-muted-foreground">{project.role} · {project.assignmentStatus}</p></div><Link href={`/dashboard/client/projects/${project.id}`} className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-navy-mid shadow-soft" aria-label={`Open ${project.title}`}><ArrowUpRight className="size-3.5" aria-hidden /></Link></div>)}</div></div>
              </div>

              <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-border bg-white/95 p-4 sm:px-7">
                {selected.portfolioUrl ? <a href={selected.portfolioUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border px-4 py-3 text-xs font-bold text-navy-mid"><ExternalLink className="size-4" aria-hidden /> Portfolio</a> : selected.githubUrl ? <a href={selected.githubUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border px-4 py-3 text-xs font-bold text-navy-mid"><Code2 className="size-4" aria-hidden /> GitHub</a> : <button type="button" onClick={() => setSelected(null)} className="rounded-2xl border border-border px-4 py-3 text-xs font-bold text-navy-mid">Close</button>}
                {selected.projects[0] ? <Link href={`/dashboard/client/messages?project=${selected.projects[0].id}`} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-navy px-4 py-3 text-xs font-bold text-white shadow-glow"><MessageCircle className="size-4" aria-hidden /> Message team</Link> : null}
              </div>
            </motion.section>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function ProfileMetric({ icon: Icon, label, value }: { icon: typeof BriefcaseBusiness; label: string; value: string }) {
  return <div className="min-w-0 rounded-2xl bg-blue-light/45 p-3"><Icon className="size-4 text-blue-vivid" aria-hidden /><p className="mt-2 truncate text-[9px] font-bold uppercase tracking-[0.06em] text-muted-foreground">{label}</p><p className="mt-1 truncate text-[11px] font-bold text-navy sm:text-xs">{value}</p></div>;
}

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "SA";
}

function roleLabel(developer: ClientDeveloper) {
  return developer.headline ?? optionLabel(TALENT_ROLES, developer.primaryRole) ?? developer.primaryRole ?? "Certified developer";
}
