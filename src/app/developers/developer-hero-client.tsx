"use client";

import { useEffect, useRef, useState } from "react";

/* ─── Animated counter hook ─── */
function useCountUp(target: number, duration = 1600) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const step = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // easeOutExpo
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
}

const STATS = [
  { value: 500, suffix: "+", label: "Active Developers" },
  { value: 50, suffix: "+", label: "Funded Projects" },
  { value: 150, suffix: "+", label: "Developers Joined" },
  { value: 98, suffix: "%", label: "Payout Success" },
] as const;

export function DeveloperHeroClient() {
  return (
    <div className="dev-hero-stats-bar">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-6 sm:grid-cols-4 sm:gap-8 lg:px-12">
        {STATS.map((stat) => (
          <StatItem key={stat.label} target={stat.value} suffix={stat.suffix} label={stat.label} />
        ))}
      </div>
    </div>
  );
}

function StatItem({ target, suffix, label }: { target: number; suffix: string; label: string }) {
  const { count, ref } = useCountUp(target);
  return (
    <div ref={ref} className="dev-hero-stat-item">
      <span className="dev-hero-stat-number">
        {count}
        {suffix}
      </span>
      <span className="dev-hero-stat-label">{label}</span>
    </div>
  );
}
