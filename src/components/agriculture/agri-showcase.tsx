"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

type ShowcaseItem = {
  src: string;
  alt: string;
  caption: string;
};

const ITEMS: ShowcaseItem[] = [
  { src: "/images/agriculture/banana-plantation.png", alt: "AI-powered banana plantation monitoring", caption: "Precision Crop Monitoring" },
  { src: "/images/agriculture/produce-traceability.png", alt: "Digital produce traceability", caption: "Produce Traceability" },
  { src: "/images/agriculture/cold-chain.png", alt: "Cold chain logistics monitoring", caption: "Cold Chain Logistics" },
  { src: "/images/agriculture/farm-to-shelf.png", alt: "Farm to shelf journey", caption: "Farm-to-Shelf Journey" },
  { src: "/images/agriculture/smart-packhouse.png", alt: "Smart packhouse operations", caption: "Smart Packhouse" },
  { src: "/images/agriculture/yield-forecasting.png", alt: "Yield forecasting dashboard", caption: "Yield Forecasting" },
];

function ShowcaseCard({ item }: { item: ShowcaseItem }) {
  return (
    <div className="group relative shrink-0 w-[260px] sm:w-[360px] lg:w-[440px] aspect-[16/10] rounded-2xl overflow-hidden shadow-showcase hover:shadow-showcase-hover transition-shadow duration-500">
      <Image
        alt={item.alt}
        src={item.src}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
        sizes="(max-width: 640px) 260px, (max-width: 1024px) 360px, 440px"
        loading="lazy"
      />
      {/* Hover caption overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
        <p className="text-white text-sm sm:text-base font-medium">
          {item.caption}
        </p>
      </div>
    </div>
  );
}

export function AgriShowcase() {
  // Duplicate items for seamless infinite scroll
  const duplicated = [...ITEMS, ...ITEMS];

  return (
    <section className="py-16 sm:py-24 overflow-hidden bg-white">
      {/* Section header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 mb-10 sm:mb-14">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <p className="cue text-emerald-600 mb-4">
            Visual Showcase
          </p>
          <h2 className="font-serif text-3xl font-bold tracking-tight text-emerald-950 sm:text-4xl lg:text-5xl">
            AI infrastructure for African agriculture
          </h2>
        </motion.div>
      </div>

      {/* Scrolling gallery */}
      <div className="relative w-full">
        {/* Fade edges — green tinted */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-24 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-24 bg-gradient-to-l from-white to-transparent z-10" />

        {/* Scrolling row */}
        <div className="image-scroll-row">
          {duplicated.map((item, i) => (
            <ShowcaseCard key={`${item.caption}-${i}`} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
