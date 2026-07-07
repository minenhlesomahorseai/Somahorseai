import {
  ClipboardList,
  Users,
  GitBranch,
  BadgeCheck,
  Radar,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Reveal } from "./reveal";
 
type Agent = {
  step: string;
  name: string;
  icon: LucideIcon;
  copy: string;
};
 
const AGENTS: Agent[] = [
  {
    step: "Agent 01",
    name: "Intake & Scoping",
    icon: ClipboardList,
    copy: "An enterprise types their problem. The agent reasons, asks the right questions, and returns a complete scope, a fixed price, and a timeline — in minutes.",
  },
  {
    step: "Agent 02",
    name: "Developer Matching",
    icon: Users,
    copy: "It scores every certified developer on skills, delivery history, availability, and agri-context, then proposes the ideal team. A human approves with one click.",
  },
  {
    step: "Agent 03",
    name: "Project Management",
    icon: GitBranch,
    copy: "It replaces the project manager — updating the client before they ask, guiding developers, flagging risk early, and catching scope changes properly.",
  },
  {
    step: "Agent 04",
    name: "Certification",
    icon: BadgeCheck,
    copy: "No CVs, no interviews. An adaptive assessment tests how a developer thinks, what they can build, and whether they understand farming and supply chains.",
  },
  {
    step: "Agent 05",
    name: "Monitoring & Intelligence",
    icon: Radar,
    copy: "Every delivered system stays watched. It detects drift, retrains, reports in plain language — and makes our core agricultural intelligence smarter forever.",
  },
];
 
export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative px-5 py-24 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="cue mb-3 text-navy-mid">The platform</p>
          <h2 className="h-section">Five AI agents that run everything</h2>
          <p className="lead mt-4">
            Each agent handles one part of the journey and hands off to the next automatically. You
            step in only to approve and to handle exceptions.
          </p>
        </Reveal>
 
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {AGENTS.map((agent, i) => {
            const Icon = agent.icon;
            return (
              <Reveal key={agent.name} delay={i * 0.06}>
                <article className="group h-full rounded-3xl border border-border bg-white p-7 shadow-soft transition duration-300 hover:-translate-y-1 hover:border-navy-mid/20 hover:shadow-card">
                  <div className="flex items-center justify-between">
                    <span className="grid size-12 place-items-center rounded-2xl bg-blue-light text-navy-mid ring-1 ring-navy-mid/10 transition group-hover:bg-navy-mid group-hover:text-white">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="cue text-muted-foreground">{agent.step}</span>
                  </div>
                  <h3 className="mt-5 font-ui text-xl font-bold text-navy">{agent.name}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{agent.copy}</p>
                </article>
              </Reveal>
            );
          })}
 
          <Reveal delay={0.3}>
            <article className="flex h-full flex-col justify-between rounded-3xl border border-navy-mid/15 bg-gradient-to-br from-navy via-navy-mid to-blue-vivid p-7 text-white shadow-card">
              <h3 className="font-display text-xl font-bold">One sentence</h3>
              <p className="mt-3 text-sm leading-6 text-white/85">
                Describe your agricultural problem — our AI scopes it, prices it, staffs it, builds
                it, delivers it, and keeps it alive.
              </p>
              <span className="mt-6 font-display text-3xl font-bold text-white/95">→</span>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}