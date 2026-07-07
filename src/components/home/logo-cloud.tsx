const ITEMS = [
  "Shoprite supply network",
  "Supabase",
  "Vercel",
  "OpenAI",
  "Gemini",
  "Paddle",
];
 
export function LogoCloud() {
  return (
    <section className="border-y border-border bg-surface/60">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <p className="cue mb-7 text-center text-muted-foreground">
          Powering African agricultural supply chains
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5 sm:gap-x-14">
          {ITEMS.map((name) => (
            <span
              key={name}
              className="font-ui text-sm font-semibold text-navy/45 transition-colors hover:text-navy sm:text-base"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}