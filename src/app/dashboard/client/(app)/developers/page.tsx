import { Globe, Sprout, UsersRound } from "lucide-react";

import { fetchAvailableDevelopers } from "@/lib/dashboard/data";
import { createClient } from "@/lib/supabase/server";
import { optionLabel, TALENT_ROLES } from "@/lib/onboarding/options";

export default async function DevelopersPage() {
  const supabase = await createClient();
  const developers = await fetchAvailableDevelopers(supabase);

  return (
    <div className="space-y-6">
      <div>
        <p className="cue text-navy-mid/70">Client dashboard</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-navy sm:text-4xl">
          Certified developers
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
          The vetted talent our Matching agent draws from to assemble your team — scored on skills,
          delivery history, and agricultural context.
        </p>
      </div>

      {developers.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-white/60 py-16 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-blue-light/70 text-navy-mid">
            <UsersRound className="size-7" aria-hidden />
          </span>
          <p className="max-w-sm text-sm text-muted-foreground">
            No certified developers are visible yet. Once talent is approved through certification,
            your matched team will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {developers.map((dev) => {
            const initials = (dev.full_name ?? "Developer")
              .split(/\s+/)
              .slice(0, 2)
              .map((p) => p[0]?.toUpperCase() ?? "")
              .join("");
            return (
              <div
                key={dev.id}
                className="rounded-3xl border border-border/70 bg-white/80 p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-elevated"
              >
                <div className="flex items-start gap-3">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-navy text-sm font-bold text-white">
                    {initials || "SA"}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-display text-base font-bold text-navy">
                      {dev.full_name ?? "Certified developer"}
                    </p>
                    <p className="truncate text-sm text-navy-mid">
                      {dev.headline ?? optionLabel(TALENT_ROLES, dev.primary_role) ?? "Developer"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {dev.years_experience ? (
                    <span className="rounded-full bg-blue-light/60 px-2.5 py-1 font-semibold text-navy-mid">
                      {dev.years_experience}+ yrs
                    </span>
                  ) : null}
                  {dev.country ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-light/60 px-2.5 py-1 font-semibold text-navy-mid">
                      <Globe className="size-3" aria-hidden /> {dev.country}
                    </span>
                  ) : null}
                  {dev.agri_experience ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent-teal/12 px-2.5 py-1 font-semibold text-accent-teal">
                      <Sprout className="size-3" aria-hidden /> Agri
                    </span>
                  ) : null}
                </div>

                {dev.skills.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {dev.skills.slice(0, 6).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-border-strong bg-white px-2.5 py-0.5 text-xs font-medium text-navy-mid"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
