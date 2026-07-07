import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
 
const COLUMNS = [
  {
    title: "Platform",
    links: [
      ["Intake & scoping", "#platform"],
      ["Developer network", "/developers"],
      ["Monitoring", "#platform"],
      ["Pricing", "#pricing"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About", "/about"],
      ["Agriculture", "/agriculture"],
      ["Careers", "#"],
      ["Contact", "#"],
    ],
  },
  {
    title: "Resources",
    links: [
      ["How it works", "#how-it-works"],
      ["FAQ", "/#faq"],
      ["Changelog", "#"],
      ["Status", "#"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["Privacy", "#"],
      ["Terms", "#"],
      ["Protection", "#protection"],
      ["Security", "#"],
    ],
  },
] as const;
 
export function Footer() {
  const year = new Date().getFullYear();
 
  return (
    <footer className="relative overflow-hidden border-t border-border bg-surface/60">
      <div className="pointer-events-none absolute -bottom-24 left-1/2 size-[60vw] max-w-[760px] -translate-x-1/2 rounded-full bg-blue-light/60 blur-[120px]" />
 
      <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-[1.5fr_repeat(4,1fr)]">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <Image src="/somahorse-logo.png" alt="" width={36} height={36} className="size-9 rounded-full object-contain" />
            <span className="font-display text-lg font-bold text-navy">
              Somahorse<span className="text-blue-vivid">.ai</span>
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">
            AI infrastructure for African agricultural supply chains. We build the systems, and our
            AI keeps them alive.
          </p>
          <Link
            href="#start"
            className="mt-6 inline-flex min-h-10 items-center gap-1.5 rounded-full bg-navy-mid px-4 text-sm font-semibold text-white transition hover:bg-navy font-ui"
          >
            Start a project <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        </div>
 
        {COLUMNS.map((column) => (
          <div key={column.title}>
            <h4 className="cue mb-4 text-muted-foreground">{column.title}</h4>
            <ul className="space-y-3">
              {column.links.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-muted-foreground transition-colors hover:text-navy-mid font-ui">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
 
      <div className="relative select-none px-6 text-center">
        <span className="font-display font-bold leading-none text-navy/[0.05]" style={{ fontSize: "clamp(3rem, 15vw, 11rem)" }}>
          somahorse.ai
        </span>
      </div>
 
      <div className="relative border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-5 text-xs text-muted-foreground md:flex-row">
          <span className="font-ui">© {year} Somahorse.ai · Durban &amp; Cape Town, South Africa</span>
          <div className="flex flex-wrap items-center justify-center gap-5 font-ui">
            <Link href="#" className="hover:text-navy">Privacy</Link>
            <Link href="#" className="hover:text-navy">Terms</Link>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-accent-teal animate-glow-pulse" />
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

