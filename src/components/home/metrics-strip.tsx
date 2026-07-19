import { Reveal } from "./reveal";
 
const METRICS = [
  { value: "R2.8M", label: "Agricultural engagement signed" },
  { value: "900+", label: "Developers in the network" },
  { value: "6", label: "Countries live across Africa" },
  { value: "MRR", label: "Recurring monitoring income, growing" },
];
 
export function MetricsStrip() {
  return (
    <section id="agriculture" className="px-4 sm:px-8 lg:px-12 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-12">
          {METRICS.map((m, i) => (
            <Reveal key={m.label} delay={i * 0.08} className="text-center lg:text-left">
              <div className="font-serif text-4xl font-bold text-navy sm:text-5xl lg:text-6xl tracking-tight">
                {m.value}
              </div>
              <div className="mx-auto mt-3 h-0.5 w-10 rounded-full bg-blue-vivid lg:mx-0" />
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{m.label}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}