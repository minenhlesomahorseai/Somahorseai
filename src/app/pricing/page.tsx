import type { Metadata } from "next";

import { FloatingNav } from "@/components/home/floating-nav";
import { Footer } from "@/components/home/footer";
import { PricingHero } from "@/components/pricing/pricing-hero";
import { PricingTiers } from "@/components/pricing/pricing-tiers";
import { RevenueSplit } from "@/components/pricing/revenue-split";
import { PricingFAQ } from "@/components/pricing/pricing-faq";
import { getMarketingUser } from "@/lib/auth/marketing";

export const metadata: Metadata = {
  title: "Pricing — Somahorse.ai",
  description: "Understand Somahorse project budget bands, deposits, milestone payments, monitoring, and the transparent talent allocation model.",
};

export default async function PricingPage() {
  const user = await getMarketingUser();
  const ctaHref = user?.startProjectPath ?? user?.dashboardPath ?? "/signup?role=client";

  return (
    <>
      <FloatingNav user={user} />
      <main className="overflow-hidden bg-[linear-gradient(180deg,#f7fbff_0%,#ffffff_38%,#f8fbff_100%)]">
        <PricingHero ctaHref={ctaHref} />
        <PricingTiers ctaHref={ctaHref} />
        <RevenueSplit />
        <PricingFAQ ctaHref={ctaHref} />
      </main>
      <Footer />
    </>
  );
}
