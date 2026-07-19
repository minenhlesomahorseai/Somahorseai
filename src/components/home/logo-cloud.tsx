const ITEMS = [
  "Shoprite supply network",
  "Supabase",
  "Vercel",
  "Gemini",
  "Paddle",
];
 
export function LogoCloud() {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.2em] text-center mb-8">
          Powering African agricultural supply chains
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-5 sm:gap-x-16">
          {ITEMS.map((name) => (
            <span
              key={name}
              className="text-sm font-semibold text-navy/35 transition-colors hover:text-navy sm:text-base tracking-wide"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}