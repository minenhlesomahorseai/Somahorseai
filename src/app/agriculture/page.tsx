import type { Metadata } from "next";

import { FloatingNav } from "@/components/home/floating-nav";
import { Footer } from "@/components/home/footer";
import { AgriHero } from "@/components/agriculture/agri-hero";
import { AgriShowcase } from "@/components/agriculture/agri-showcase";
import { AgriSolutions } from "@/components/agriculture/agri-solutions";
import { AgriHowItWorks } from "@/components/agriculture/agri-how-it-works";
import { AgriGroundTruth } from "@/components/agriculture/agri-ground-truth";
import { AgriMetrics } from "@/components/agriculture/agri-metrics";
import { AgriFAQ } from "@/components/agriculture/agri-faq";
import { AgriCTA } from "@/components/agriculture/agri-cta";
import { getMarketingUser } from "@/lib/auth/marketing";

export const metadata: Metadata = {
  title: "Agriculture — Somahorse.ai",
  description:
    "AI infrastructure built for African agriculture: produce traceability, yield forecasting, logistics, farm-to-shelf compliance, and live monitoring.",
};

export default async function AgriculturePage() {
  const user = await getMarketingUser();

  return (
    <>
      <FloatingNav user={user} />
      <main className="relative overflow-hidden bg-white text-emerald-950">
        <AgriHero user={user} />
        <AgriShowcase />
        <AgriSolutions />
        <AgriHowItWorks />
        <AgriGroundTruth />
        <AgriMetrics />
        <AgriFAQ />
        <AgriCTA user={user} />
      </main>
      <Footer />
    </>
  );
}
