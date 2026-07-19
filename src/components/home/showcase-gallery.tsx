import Image from "next/image";
import { Reveal } from "./reveal";

type ShowcaseItem = {
  src: string;
  alt: string;
  caption: string;
};

const ITEMS: ShowcaseItem[] = [
  { src: "/images/showcase/precision.png", alt: "Precision Agriculture", caption: "Precision Agriculture" },
  { src: "/images/showcase/supply-chain.png", alt: "Supply Chain Intelligence", caption: "Supply Chain Intelligence" },
  { src: "/images/showcase/research.png", alt: "AI Research", caption: "AI-Powered Research" },
  { src: "/images/showcase/operations.png", alt: "Operations Monitoring", caption: "Operations Monitoring" },
  { src: "/images/showcase/infrastructure.png", alt: "Smart Infrastructure", caption: "Smart Infrastructure" },
  { src: "/images/showcase/landscape.png", alt: "African Landscapes", caption: "African Agriculture" },
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
        <p className="text-white text-sm sm:text-base font-medium">
          {item.caption}
        </p>
      </div>
    </div>
  );
}

export function ShowcaseGallery() {
  // Duplicate items for seamless infinite scroll
  const duplicated = [...ITEMS, ...ITEMS];

  return (
    <section className="py-16 sm:py-24 overflow-hidden">
      {/* Section header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 mb-10 sm:mb-14">
        <Reveal className="text-center">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.2em] mb-4">
            Visual Showcase
          </p>
          <h2 className="h-section">
            Exploring AI across African agriculture
          </h2>
        </Reveal>
      </div>

      {/* Scrolling gallery */}
      <div className="relative w-full">
        {/* Fade edges */}
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
