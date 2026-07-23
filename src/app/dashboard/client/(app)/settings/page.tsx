import { Globe2, Settings } from "lucide-react";

import { ComingSoon } from "@/components/dashboard/coming-soon";
import { CurrencyPreferenceForm } from "@/components/dashboard/currency-preference-form";
import { currencyOptions } from "@/lib/currency/config";
import { loadClientSession } from "@/lib/dashboard/session";

export default async function SettingsPage() {
  const { context } = await loadClientSession();

  return (
    <div className="space-y-6">
      <div>
        <p className="cue text-navy-mid/70">Client dashboard</p>
        <h1 className="mt-1 font-ui text-3xl font-bold tracking-tight text-navy sm:text-4xl">
          Settings
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
          Manage regional pricing and account preferences.
        </p>
      </div>

      <section className="rounded-3xl border border-border/70 bg-white/80 p-6 shadow-card sm:p-8">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-blue-light/70 text-navy-mid">
            <Globe2 className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-ui text-lg font-bold text-navy">
              Currency and region
            </h2>
            <p className="text-xs text-muted-foreground">
              Your current preference is {context.preferredCurrency}.
            </p>
          </div>
        </div>
        <CurrencyPreferenceForm
          currentCurrency={context.preferredCurrency}
          options={currencyOptions()}
          description="We use this for estimates and checkout. If Paddle does not support the selected currency, checkout uses the exact USD equivalent. Existing invoices and the platform's ZAR ledger never change."
        />
      </section>

      <ComingSoon
        title="More account settings"
        description="Company, access, notification, and security controls are being prepared."
        icon={Settings}
        points={[
          "Company and contact details",
          "Team members and access roles",
          "Notification and email preferences",
          "Security and sign-in options",
        ]}
      />
    </div>
  );
}
