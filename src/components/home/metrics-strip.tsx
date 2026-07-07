import { Reveal } from "./reveal";
 
const METRICS = [
  { value: "R2.8M", label: "Agricultural engagement signed" },
  { value: "900", label: "Developers in the network" },
  { value: "6", label: "Countries live across Africa" },
  { value: "MRR", label: "Recurring monitoring income, growing" },
];
 
export function MetricsStrip() {
  return (
    <section id="agriculture" className="px-5 py-20">
      <div className="mx-auto max-w-6xl rounded-3xl border border-border bg-surface/70 px-6 py-12 sm:px-12">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {METRICS.map((m, i) => (
            <Reveal key={m.label} delay={i * 0.06} className="text-center sm:text-left">
              <div className="font-display text-4xl font-bold text-navy sm:text-5xl">
                {m.value}
              </div>
              <div className="mx-auto mt-2 h-0.5 w-10 rounded-full bg-blue-vivid sm:mx-0" />
              <p className="mt-3 text-sm text-muted-foreground">{m.label}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}