import Image from "next/image";
import { Reveal } from "./reveal";

type Feature = {
  number: string;
  title: string;
  description: string;
  image: string;
};

const FEATURES: Feature[] = [
  {
    number: "01",
    title: "AI-Powered Scoping",
    description:
      "An enterprise types their problem. The agent reasons, asks the right questions, and returns a complete scope, a fixed price, and a timeline — in minutes.",
    image: "/card-research.png",
  },
  {
    number: "02",
    title: "Certified Dev Teams",
    description:
      "We score every certified developer on skills, delivery history, availability, and agri-context, then propose the ideal team. A human approves with one click.",
    image: "/card-infrastructure.png",
  },
  {
    number: "03",
    title: "Intelligent Operations",
    description:
      "Every delivered system stays watched. Our monitoring agent detects drift, retrains, reports in plain language — and makes our core intelligence smarter forever.",
    image: "/card-operations.png",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-32 lg:py-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        <div className="px-4 sm:px-8 lg:px-12">
          {/* Section header */}
          <Reveal className="max-w-3xl mx-auto text-center mb-12 sm:mb-16 lg:mb-20">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.2em] mb-4">
              What We Do
            </p>
            <h2 className="h-section">
              From plain language to production systems
            </h2>
          </Reveal>

          {/* 3-column image cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {FEATURES.map((feature, i) => (
              <Reveal key={feature.number} delay={i * 0.1}>
                <div className="group relative rounded-2xl overflow-hidden cursor-default">
                  {/* Background image */}
                  <div className="absolute inset-0">
                    <Image
                      alt=""
                      src={feature.image}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/15 group-hover:from-black/65 group-hover:via-black/30 group-hover:to-black/10 transition-colors duration-300" />
                  </div>

                  {/* Content overlay */}
                  <div className="relative p-7 sm:p-8 min-h-[240px] sm:min-h-[280px] flex flex-col ring-1 ring-inset ring-white/10 rounded-2xl">
                    <span className="text-xs font-mono text-white/60 mb-4">
                      {feature.number}
                    </span>
                    <h3 className="text-lg sm:text-xl font-semibold text-white tracking-tight leading-snug mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-white/80 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}