import { Database, Repeat, TrendingUp } from "lucide-react";
import { Reveal } from "./reveal";
 
const POINTS = [
  {
    icon: Repeat,
    title: "Every project teaches the system",
    copy: "Crops, weather, supply chains, developer performance — each build feeds knowledge back into the core.",
  },
  {
    icon: Database,
    title: "The knowledge never leaves",
    copy: "It accumulates across every system we monitor, becoming the most valuable agri dataset on the continent.",
  },
  {
    icon: TrendingUp,
    title: "We get harder to copy, daily",
    copy: "A competitor would have to redo every project, with every client, over the same years. They cannot.",
  },
];
 
export function IntelligenceBand() {
  return (
    <section id="platform" className="px-5 py-12">
      <Reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-[34px] border border-navy-mid/20 bg-navy px-6 py-16 text-white shadow-calm sm:px-12 sm:py-20">
        <div className="pointer-events-none absolute -right-20 -top-24 size-[480px] rounded-full bg-blue-vivid/25 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-28 -left-16 size-[420px] rounded-full bg-blue-sky/20 blur-[120px]" />
        <div className="dotted-grid pointer-events-none absolute inset-0 opacity-[0.08]" />
 
        <div className="relative max-w-2xl">
          <p className="cue mb-3 text-blue-sky">The moat</p>
          <h2 className="font-display text-3xl font-bold leading-tight sm:text-5xl">
            Every project makes us{" "}
            <span className="bg-gradient-to-r from-blue-sky to-white bg-clip-text text-transparent">
              smarter — forever.
            </span>
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/75">
            We don&apos;t grow by adding people. We grow by adding intelligence. The second
            client&apos;s data makes us better for the third. The tenth makes us dramatically better
            for the eleventh.
          </p>
        </div>
 
        <div className="relative mt-12 grid gap-5 sm:grid-cols-3">
          {POINTS.map(({ icon: Icon, title, copy }) => (
            <div key={title} className="rounded-2xl border border-white/12 bg-white/5 p-6 backdrop-blur-sm">
              <span className="grid size-11 place-items-center rounded-xl bg-blue-vivid/20 text-blue-sky ring-1 ring-white/10">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-ui text-base font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/70">{copy}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}