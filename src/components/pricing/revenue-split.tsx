"use client";

import { motion } from "framer-motion";
import { BadgeCheck, CalendarCheck2, CreditCard, FileCheck2, Landmark, PieChart, Rocket } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

const PAYMENT_STEPS = [
  { icon: FileCheck2, step: "01", title: "Agree the quote", text: "The project scope, build fee, deposit, milestones, and monitoring are visible before checkout." },
  { icon: CreditCard, step: "02", title: "Fund the start", text: "A deposit of roughly one-third confirms the project and moves it into delivery." },
  { icon: CalendarCheck2, step: "03", title: "Pay with progress", text: "The remaining build fee is staged against the project’s agreed delivery milestones." },
  { icon: Rocket, step: "04", title: "Keep it healthy", text: "When monitoring is part of the quote, monthly payments begin after the system goes live." },
] as const;

export function RevenueSplit() {
  return (
    <section className="relative overflow-hidden bg-navy px-4 py-20 text-white sm:px-6 sm:py-28 lg:px-8">
      <div className="pointer-events-none absolute inset-0 dotted-grid opacity-[0.08]" aria-hidden />
      <div className="pointer-events-none absolute -left-32 top-10 size-96 rounded-full bg-blue-vivid/20 blur-[140px]" aria-hidden />
      <div className="relative mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="cue text-blue-300">How payments work</p>
          <h2 className="mt-3 text-balance font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">A payment rhythm that follows the work.</h2>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/65 sm:text-base">Clients can see what has been paid, what is due next, and what the payment relates to. Talent can see their allocation move from owed to paid.</p>
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PAYMENT_STEPS.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.article
                key={item.step}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.55, ease: EASE, delay: index * 0.07 }}
                className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl"
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-xl bg-white/10 text-blue-200"><Icon className="size-5" aria-hidden /></span>
                  <span className="font-mono text-xs font-bold text-white/35">{item.step}</span>
                </div>
                <h3 className="mt-6 text-lg font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/60">{item.text}</p>
              </motion.article>
            );
          })}
        </div>

        <div className="mt-12 grid overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.07] shadow-2xl backdrop-blur-2xl lg:grid-cols-[0.82fr_1.18fr]">
          <div className="border-b border-white/10 p-6 sm:p-8 lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-blue-vivid/20 text-blue-200"><PieChart className="size-5" aria-hidden /></span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-300">Verified payments</p>
                <h3 className="mt-0.5 text-xl font-bold text-white">Transparent allocation</h3>
              </div>
            </div>
            <p className="mt-5 text-sm leading-7 text-white/62">Every successful client payment is recorded against the project and split into the talent pool and platform allocation.</p>
            <div className="mt-7 h-3 overflow-hidden rounded-full bg-white/10">
              <motion.div initial={{ width: 0 }} whileInView={{ width: "60%" }} viewport={{ once: true }} transition={{ duration: 1, ease: EASE }} className="h-full rounded-full bg-gradient-to-r from-accent-teal to-blue-vivid" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div><strong className="block text-2xl text-white">60%</strong><span className="text-white/50">Talent pool</span></div>
              <div className="text-right"><strong className="block text-2xl text-white">40%</strong><span className="text-white/50">Platform</span></div>
            </div>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
            <AllocationNote icon={BadgeCheck} title="For the client" text="Payments, invoices, milestones, and remaining amounts stay attached to the project workspace." />
            <AllocationNote icon={Landmark} title="For talent" text="The 60% pool is allocated across the project team and tracked as owed until the admin records payout." />
          </div>
        </div>
      </div>
    </section>
  );
}

function AllocationNote({ icon: Icon, title, text }: { icon: typeof BadgeCheck; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-navy/35 p-5">
      <Icon className="size-5 text-blue-300" aria-hidden />
      <h4 className="mt-4 font-bold text-white">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-white/58">{text}</p>
    </div>
  );
}
