"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Check, Zap, Shield, Rocket, Building2 } from "lucide-react";
import Link from "next/link";

const EASE = [0.16, 1, 0.3, 1] as const;

const TIERS = [
  {
    name: "Basic",
    description: "Quick prototypes and MVPs",
    price: "$800–$1,600",
    icon: Zap,
    features: [
      "Plain-language project scoping",
      "Basic AI-powered planning",
      "Standard developer matching",
      "Core delivery management",
      "Email support",
    ],
    cta: "Get started",
    popular: false,
  },
  {
    name: "Standard",
    description: "Full-featured agricultural solutions",
    price: "$3,800–$5,400",
    icon: Rocket,
    features: [
      "Everything in Basic",
      "Advanced AI scoping & pricing",
      "Certified developer teams",
      "Priority delivery management",
      "Drift monitoring alerts",
      "Slack support",
    ],
    cta: "Most popular",
    popular: true,
  },
  {
    name: "Premium",
    description: "Complex enterprise deployments",
    price: "$8,100–$16,200",
    icon: Shield,
    features: [
      "Everything in Standard",
      "Dedicated project manager",
      "Custom integrations",
      "Advanced analytics dashboard",
      "24/7 priority support",
      "SLA guarantees",
    ],
    cta: "Contact sales",
    popular: false,
  },
  {
    name: "Enterprise",
    description: "Large-scale agricultural networks",
    price: "Custom pricing",
    icon: Building2,
    features: [
      "Everything in Premium",
      "Multi-project deployments",
      "Custom AI model training",
      "White-label solutions",
      "Dedicated success team",
      "Custom SLAs & contracts",
    ],
    cta: "Contact sales",
    popular: false,
  },
];

function PricingCard({ tier, index }: { tier: typeof TIERS[0]; index: number }) {
  const Icon = tier.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE, delay: index * 0.1 }}
      className={`relative rounded-3xl border ${
        tier.popular
          ? "border-navy-mid/30 bg-gradient-to-b from-white to-blue-mist shadow-card"
          : "border-border bg-white/80 shadow-soft"
      } p-8 backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-elevated`}
    >
      {tier.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-mid px-4 py-1.5 text-xs font-semibold text-white shadow-glow font-ui">
            <span className="size-1.5 rounded-full bg-blue-vivid animate-glow-pulse" />
            Most popular
          </span>
        </div>
      )}

      <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-navy-mid/10 ring-1 ring-navy-mid/20">
        <Icon className="size-7 text-navy-mid" />
      </div>

      <h3 className="font-display text-2xl font-bold text-navy">{tier.name}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{tier.description}</p>

      <div className="mt-6">
        <span className="font-display text-4xl font-bold text-navy">{tier.price}</span>
        <span className="ml-2 text-sm text-muted-foreground">per project</span>
      </div>

      <ul className="mt-8 space-y-4">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <Check className="mt-0.5 size-5 shrink-0 text-accent-teal" />
            <span className="text-sm text-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href="#start"
        className={`mt-8 flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition font-ui ${
          tier.popular
            ? "bg-navy-mid text-white shadow-glow hover:bg-navy"
            : "border border-border-strong bg-white/80 text-navy hover:border-navy-mid/25 hover:bg-blue-mist"
        }`}
      >
        {tier.cta}
        <ArrowUpRight className="size-4" />
      </Link>
    </motion.div>
  );
}

export function PricingTiers() {
  return (
    <section className="px-2 py-24 sm:px-3">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="h-section">Choose your tier</h2>
          <p className="lead mx-auto mt-4 max-w-2xl">
            Scale from prototypes to enterprise deployments. All tiers include our AI-powered
            scoping and certified developer teams.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier, index) => (
            <PricingCard key={tier.name} tier={tier} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
