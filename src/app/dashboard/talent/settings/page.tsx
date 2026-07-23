import { Bell, Globe2, LockKeyhole, Mail, ShieldCheck, Smartphone, UserRound } from "lucide-react";

import { CurrencyPreferenceForm } from "@/components/dashboard/currency-preference-form";
import { PreviewPill, TalentGlassCard, TalentPageHeader, TalentSectionTitle } from "@/components/dashboard/talent-ui";
import { currencyOptions } from "@/lib/currency/config";
import { loadTalentSession } from "@/lib/dashboard/talent";

export default async function TalentSettingsPage() {
  const { user, preferredCurrency } = await loadTalentSession();

  return (
    <div className="space-y-6">
      <TalentPageHeader
        eyebrow="Account"
        title="Settings"
        description="Manage your account, notification preferences, privacy, and workspace experience."
        action={<PreviewPill />}
      />

      <div className="grid gap-4 lg:grid-cols-12">
        <TalentGlassCard className="lg:col-span-7">
          <TalentSectionTitle title="Account details" icon={UserRound} />
          <div className="grid gap-3 sm:grid-cols-2">
            <SettingField icon={UserRound} label="Full name" value={user.fullName ?? "Not provided"} />
            <SettingField icon={Mail} label="Email address" value={user.email ?? "Not provided"} />
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">Profile identity is managed through your talent profile. Authentication changes will be available here soon.</p>
        </TalentGlassCard>

        <TalentGlassCard className="lg:col-span-5">
          <TalentSectionTitle title="Security" icon={ShieldCheck} />
          <div className="space-y-3">
            <PreferenceRow icon={LockKeyhole} title="Password and sign-in" detail="Protected by your current authentication method" />
            <PreferenceRow icon={Smartphone} title="Two-step verification" detail="Additional account protection coming soon" />
          </div>
        </TalentGlassCard>

        <TalentGlassCard className="lg:col-span-12">
          <TalentSectionTitle title="Currency and payouts" icon={Globe2} />
          <CurrencyPreferenceForm
            currentCurrency={preferredCurrency}
            options={currencyOptions()}
            description="We use this preference to show your payout equivalent. The original ZAR allocation and the exchange-rate snapshot are kept permanently, so historical earnings never change when rates move."
          />
        </TalentGlassCard>

        <TalentGlassCard className="lg:col-span-12">
          <TalentSectionTitle title="Notifications" icon={Bell} />
          <div className="grid gap-3 md:grid-cols-3">
            <PreferenceToggle title="Project invites" detail="New opportunities matched to your profile" enabled />
            <PreferenceToggle title="Project updates" detail="Assignments, milestones, and delivery changes" enabled />
            <PreferenceToggle title="Payment updates" detail="Milestone approvals and payout activity" enabled />
          </div>
        </TalentGlassCard>
      </div>
    </div>
  );
}

function SettingField({ icon: Icon, label, value }: { icon: typeof UserRound; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/75 bg-white/50 p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
        <p className="text-[10px] font-bold uppercase tracking-[0.08em]">{label}</p>
      </div>
      <p className="mt-2 truncate text-sm font-bold text-navy">{value}</p>
    </div>
  );
}

function PreferenceRow({ icon: Icon, title, detail }: { icon: typeof LockKeyhole; title: string; detail: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/45 p-3.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-vivid/10 text-blue-vivid"><Icon className="size-4" aria-hidden /></span>
      <div>
        <p className="text-xs font-bold text-navy">{title}</p>
        <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function PreferenceToggle({ title, detail, enabled }: { title: string; detail: string; enabled: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/75 bg-white/48 p-4">
      <div>
        <p className="text-xs font-bold text-navy">{title}</p>
        <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{detail}</p>
      </div>
      <span className={`relative mt-0.5 h-6 w-10 shrink-0 rounded-full ${enabled ? "bg-blue-vivid" : "bg-border-strong"}`}>
        <span className={`absolute top-1 size-4 rounded-full bg-white shadow-soft ${enabled ? "right-1" : "left-1"}`} />
      </span>
    </div>
  );
}
