import type { Metadata } from "next";

import { FloatingNav } from "@/components/home/floating-nav";
import { Footer } from "@/components/home/footer";
import { PricingHero } from "@/components/pricing/pricing-hero";
import { PricingTiers } from "@/components/pricing/pricing-tiers";
import { RevenueSplit } from "@/components/pricing/revenue-split";
import { PricingFAQ } from "@/components/pricing/pricing-faq";
import { getMarketingUser } from "@/lib/auth/marketing";
import {
  BASE_CURRENCY,
  formatCompactMoney,
} from "@/lib/currency/config";
import { getVisitorCurrencyContext } from "@/lib/currency/context";
import { tryQuoteFx } from "@/lib/currency/fx";

export const metadata: Metadata = {
  title: "Pricing — Somahorse.ai",
  description: "Understand Somahorse project budget bands, deposits, milestone payments, monitoring, and the transparent talent allocation model.",
};

export default async function PricingPage() {
  const [user, visitor] = await Promise.all([
    getMarketingUser(),
    getVisitorCurrencyContext(),
  ]);
  const ctaHref = user?.startProjectPath ?? user?.dashboardPath ?? "/signup?role=client";
  const requestedCurrency = user?.preferredCurrency ?? visitor.currency;
  const fx = await tryQuoteFx(1, BASE_CURRENCY, requestedCurrency);
  const currency = fx ? requestedCurrency : BASE_CURRENCY;
  const rate = fx?.rate ?? 1;
  const localized = currency !== BASE_CURRENCY;
  const money = (amountZar: number) =>
    formatCompactMoney(amountZar * rate, currency);
  const budgetRanges = [
    `Under ${money(250_000)}`,
    `${money(250_000)}–${money(1_000_000)}`,
    `${money(1_000_000)}–${money(2_500_000)}`,
    `${money(2_500_000)}+`,
  ];

  return (
    <>
      <FloatingNav user={user} />
      <main className="overflow-hidden bg-[linear-gradient(180deg,#f7fbff_0%,#ffffff_38%,#f8fbff_100%)]">
        <PricingHero
          ctaHref={ctaHref}
          currencyCode={currency}
          localized={localized}
        />
        <PricingTiers ctaHref={ctaHref} budgetRanges={budgetRanges} />
        <RevenueSplit />
        <PricingFAQ ctaHref={ctaHref} currencyCode={currency} />
      </main>
      <Footer />
    </>
  );
}
