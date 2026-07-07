import { FloatingNav } from "@/components/home/floating-nav";
import { Hero } from "@/components/home/hero";
import { LogoCloud } from "@/components/home/logo-cloud";
import { HowItWorks } from "@/components/home/how-it-works";
import { IntelligenceBand } from "@/components/home/intelligence-band";
import { MetricsStrip } from "@/components/home/metrics-strip";
import { HomeFAQ } from "@/components/home/home-faq";
import { FinalCTA } from "@/components/home/final-cta";
import { Footer } from "@/components/home/footer";
import { getMarketingUser } from "@/lib/auth/marketing";

export default async function Home() {
  const user = await getMarketingUser();
  return (
    <>
      <FloatingNav user={user} />
      <main>
        <Hero user={user} />
        <LogoCloud />
        <HowItWorks />
        <IntelligenceBand />
        <MetricsStrip />
        <HomeFAQ />
        <FinalCTA user={user} />
      </main>
      <Footer />
    </>
  );
}
