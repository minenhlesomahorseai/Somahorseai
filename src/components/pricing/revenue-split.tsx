"use client";

import { motion } from "framer-motion";
import { Users, TrendingUp, PieChart } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

export function RevenueSplit() {
  return (
    <section className="px-2 py-24 sm:px-3">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="h-section">Developer-first revenue model</h2>
          <p className="lead mx-auto mt-4 max-w-2xl">
            We believe in empowering our developer community. That&apos;s why we offer one of the most
            competitive revenue splits in the industry.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Revenue Split Visual */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
            className="relative rounded-3xl border border-border bg-white/80 p-8 shadow-soft backdrop-blur-sm"
          >
            <div className="mb-8 flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-navy-mid/10 ring-1 ring-navy-mid/20">
                <PieChart className="size-6 text-navy-mid" />
              </div>
              <div>
                <h3 className="font-ui text-xl font-bold text-navy">Revenue Distribution</h3>
                <p className="text-sm text-muted-foreground">Per project fee</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-semibold text-navy font-ui">Developers</span>
                  <span className="font-display text-2xl font-bold text-accent-teal">60%</span>
                </div>
                <div className="h-4 overflow-hidden rounded-full bg-border">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: "60%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: EASE, delay: 0.2 }}
                    className="h-full rounded-full bg-gradient-to-r from-accent-teal to-blue-vivid"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-semibold text-navy font-ui">Somahorse.ai</span>
                  <span className="font-display text-2xl font-bold text-navy-mid">40%</span>
                </div>
                <div className="h-4 overflow-hidden rounded-full bg-border">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: "40%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: EASE, delay: 0.4 }}
                    className="h-full rounded-full bg-gradient-to-r from-navy-mid to-navy"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-2xl bg-blue-mist p-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-navy">Example:</span> On a $5,000 Standard project,
                developers earn <span className="font-bold text-accent-teal">$3,000</span> while
                Somahorse.ai retains <span className="font-bold text-navy-mid">$2,000</span> for platform
                operations and support.
              </p>
            </div>
          </motion.div>

          {/* Additional Info */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
              className="rounded-3xl border border-border bg-white/80 p-8 shadow-soft backdrop-blur-sm"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-accent-teal/10 ring-1 ring-accent-teal/25">
                  <Users className="size-6 text-accent-teal" />
                </div>
                <div>
                  <h3 className="font-ui text-xl font-bold text-navy">Certified Network</h3>
                  <p className="text-sm text-muted-foreground">900+ active developers</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Join our growing community of certified developers building agricultural solutions
                across Africa. Get access to projects, training, and ongoing support.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
              className="rounded-3xl border border-border bg-white/80 p-8 shadow-soft backdrop-blur-sm"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-accent-amber/10 ring-1 ring-accent-amber/25">
                  <TrendingUp className="size-6 text-accent-amber" />
                </div>
                <div>
                  <h3 className="font-ui text-xl font-bold text-navy">Market Opportunity</h3>
                  <p className="text-sm text-muted-foreground">Growing across sectors</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Agriculture</span>
                  <span className="font-display font-semibold text-navy">$150M → $600M</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Fintech</span>
                  <span className="font-display font-semibold text-navy">$400M → $1.5B</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Edtech</span>
                  <span className="font-display font-semibold text-navy">$100M → $400M</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
