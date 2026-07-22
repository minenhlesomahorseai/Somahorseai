import Link from "next/link";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  Code2,
  ExternalLink,
  GitFork,
  Globe2,
  Mail,
  MapPin,
  Sprout,
  UserRound,
} from "lucide-react";

import { TalentGlassCard, TalentPageHeader, TalentSectionTitle } from "@/components/dashboard/talent-ui";
import { loadTalentSession, talentProfileCompletion } from "@/lib/dashboard/talent";
import { optionLabel, TALENT_ROLES } from "@/lib/onboarding/options";

export default async function TalentProfilePage() {
  const { user, talent } = await loadTalentSession();
  const role = optionLabel(TALENT_ROLES, talent.primary_role) ?? "Independent technologist";
  const completion = talentProfileCompletion(talent);
  const completionPercent = Math.round((completion / 7) * 100);
  const links = [
    { label: "Portfolio", href: talent.portfolio_url, icon: Globe2 },
    { label: "GitHub", href: talent.github_url, icon: GitFork },
  ].filter((link): link is { label: string; href: string; icon: typeof Globe2 } => Boolean(link.href));

  return (
    <div className="space-y-6">
      <TalentPageHeader
        eyebrow="Professional identity"
        title="Talent profile"
        description="The verified signals the Matching Agent uses to connect you with the right work."
        action={
          <Link href="/onboarding/talent" className="inline-flex items-center justify-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-bold text-white shadow-glow transition hover:bg-navy-mid">
            Edit profile <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-12">
        <section className="talent-glass-dark relative overflow-hidden rounded-[2rem] p-6 text-white sm:p-8 lg:col-span-5 lg:row-span-2">
          <div className="absolute -right-16 -top-14 size-56 rounded-full border border-white/10 bg-white/5" />
          <div className="relative flex h-full min-h-[25rem] flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold">
                <UserRound className="size-3.5" aria-hidden /> Talent profile
              </span>
              <span className="grid size-16 place-items-center rounded-3xl border border-white/15 bg-white/10 font-display text-xl font-bold backdrop-blur-xl">
                {user.initials}
              </span>
            </div>
            <div className="mt-14">
              <h2 className="font-display text-3xl font-bold">{user.fullName ?? "Your profile"}</h2>
              <p className="mt-2 text-sm leading-6 text-white/65">{talent.headline ?? role}</p>
              <div className="mt-5 space-y-2.5 text-xs text-white/75">
                <p className="flex items-center gap-2"><BriefcaseBusiness className="size-4 text-white/45" aria-hidden /> {role}{talent.years_experience ? ` · ${talent.years_experience}+ years` : ""}</p>
                {talent.country ? <p className="flex items-center gap-2"><MapPin className="size-4 text-white/45" aria-hidden /> {talent.country}</p> : null}
                {user.email ? <p className="flex items-center gap-2"><Mail className="size-4 text-white/45" aria-hidden /> {user.email}</p> : null}
              </div>
              {links.length ? (
                <div className="mt-6 flex flex-wrap gap-2">
                  {links.map((item) => {
                    const Icon = item.icon;
                    return (
                      <a key={item.label} href={item.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-navy transition hover:bg-blue-mist">
                        <Icon className="size-3.5" aria-hidden /> {item.label} <ExternalLink className="size-3" aria-hidden />
                      </a>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <TalentGlassCard className="lg:col-span-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-blue-vivid">Profile strength</p>
              <p className="mt-2 font-display text-4xl font-bold text-navy">{completionPercent}%</p>
            </div>
            <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${completion === 7 ? "bg-accent-teal/10 text-accent-teal" : "bg-accent-amber/12 text-accent-amber"}`}>
              {completion === 7 ? "Complete" : `${7 - completion} signals missing`}
            </span>
          </div>
          <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-blue-light">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-vivid to-accent-teal" style={{ width: `${completionPercent}%` }} />
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">A complete profile gives the Matching Agent more high-confidence signals when ranking you for projects.</p>
        </TalentGlassCard>

        <TalentGlassCard className="lg:col-span-7">
          <TalentSectionTitle title="About your work" icon={UserRound} />
          <p className="text-sm leading-7 text-navy-mid">{talent.bio ?? "Add a short bio that explains the problems you solve best and the outcomes you have delivered."}</p>
        </TalentGlassCard>

        <TalentGlassCard className="lg:col-span-7">
          <TalentSectionTitle title="Skills" icon={Code2} />
          {talent.skills.length ? (
            <div className="flex flex-wrap gap-2">
              {talent.skills.map((skill) => (
                <span key={skill} className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/65 px-3 py-1.5 text-xs font-semibold text-navy-mid shadow-soft">
                  <CheckCircle2 className="size-3.5 text-accent-teal" aria-hidden /> {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No skills added yet.</p>
          )}
        </TalentGlassCard>

        <TalentGlassCard className="lg:col-span-5">
          <TalentSectionTitle title="Agricultural context" icon={Sprout} />
          <p className="text-sm leading-7 text-navy-mid">{talent.agri_experience ?? "Add any agriculture, supply-chain, logistics, or field-system experience that can strengthen project matching."}</p>
        </TalentGlassCard>
      </div>
    </div>
  );
}
