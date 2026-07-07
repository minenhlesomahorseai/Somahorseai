import Link from "next/link";
import { redirect } from "next/navigation";

import { fetchProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

export default async function TalentDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await fetchProfile(supabase, user.id);

  if (!profile || profile.role !== "talent") {
    redirect("/onboarding/talent");
  }

  return (
    <main className="min-h-screen bg-background hero-field dotted-grid flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl rounded-3xl border border-border/80 bg-white/80 p-10 shadow-elevated backdrop-blur-xl text-center">
        <h1 className="font-display text-3xl font-bold text-navy">Talent dashboard</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Dashboard placeholder for talent who have completed onboarding.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full bg-navy-mid px-6 text-sm font-semibold text-white shadow-glow transition hover:bg-navy"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
