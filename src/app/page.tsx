import { FloatingNav } from "@/components/home/floating-nav";
import { Hero } from "@/components/home/hero";
import { LogoCloud } from "@/components/home/logo-cloud";
import { HowItWorks } from "@/components/home/how-it-works";
import { ShowcaseGallery } from "@/components/home/showcase-gallery";
import { IntelligenceBand } from "@/components/home/intelligence-band";
import { MetricsStrip } from "@/components/home/metrics-strip";
import { HomeFAQ } from "@/components/home/home-faq";
import { FinalCTA } from "@/components/home/final-cta";
import { Footer } from "@/components/home/footer";
import { getMarketingUser } from "@/lib/auth/marketing";
import { BASE_CURRENCY, formatCompactMoney } from "@/lib/currency/config";
import { getVisitorCurrencyContext } from "@/lib/currency/context";
import { tryQuoteFx } from "@/lib/currency/fx";

export default async function Home() {
  const [user, visitor] = await Promise.all([
    getMarketingUser(),
    getVisitorCurrencyContext(),
  ]);
  const requestedCurrency = user?.preferredCurrency ?? visitor.currency;
  const fx = await tryQuoteFx(1, BASE_CURRENCY, requestedCurrency);
  const currency = fx ? requestedCurrency : BASE_CURRENCY;
  const engagementValue = formatCompactMoney(
    2_800_000 * (fx?.rate ?? 1),
    currency
  );

  return (
    <>
      <FloatingNav user={user} />
      <main>
        <Hero user={user} />
        <LogoCloud />
        <HowItWorks />
        <ShowcaseGallery />
        <IntelligenceBand />
        <MetricsStrip engagementValue={engagementValue} />
        <HomeFAQ />
        <FinalCTA user={user} />
      </main>
      <Footer />
    </>
  );
}
