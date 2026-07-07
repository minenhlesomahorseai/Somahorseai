import type { LucideIcon } from "lucide-react";
import {
  Sprout,
  Landmark,
  GraduationCap,
  HeartPulse,
  Factory,
  Boxes,
  LineChart,
  Truck,
  Database,
  Activity,
  Rocket,
  CalendarClock,
  CalendarRange,
  CalendarDays,
  Infinity as InfinityIcon,
  Wallet,
  Coins,
  Banknote,
  Gem,
  HelpCircle,
} from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon: LucideIcon;
}

export const CLIENT_SECTORS: SelectOption[] = [
  { value: "agriculture", label: "Agriculture", description: "Farming & supply chains", icon: Sprout },
  { value: "fintech", label: "Fintech", description: "Payments, lending, risk", icon: Landmark },
  { value: "edtech", label: "Edtech", description: "Learning & training", icon: GraduationCap },
  { value: "healthcare", label: "Healthcare", description: "Care & diagnostics", icon: HeartPulse },
  { value: "manufacturing", label: "Manufacturing", description: "Production & logistics", icon: Factory },
  { value: "other", label: "Something else", description: "Tell us about it", icon: Boxes },
];

export const CLIENT_PROJECT_TYPES: SelectOption[] = [
  { value: "supply_chain", label: "Supply chain intelligence", description: "Connect what's grown to what's needed", icon: Truck },
  { value: "prediction", label: "Prediction & forecasting", description: "Yields, demand, pricing", icon: LineChart },
  { value: "data_platform", label: "Data platform", description: "Unify and structure your data", icon: Database },
  { value: "monitoring", label: "Monitoring system", description: "Watch a live system & catch drift", icon: Activity },
  { value: "other", label: "Not sure yet", description: "Our AI will help scope it", icon: HelpCircle },
];

export const CLIENT_TIMELINES: SelectOption[] = [
  { value: "asap", label: "As soon as possible", description: "We're ready to move now", icon: Rocket },
  { value: "1_3_months", label: "1 – 3 months", description: "Planning the next quarter", icon: CalendarClock },
  { value: "3_6_months", label: "3 – 6 months", description: "Mapping the roadmap", icon: CalendarRange },
  { value: "flexible", label: "Flexible", description: "Quality over speed", icon: CalendarDays },
];

export const CLIENT_BUDGETS: SelectOption[] = [
  { value: "under_250k", label: "Under R250k", description: "Proof of concept", icon: Wallet },
  { value: "250k_1m", label: "R250k – R1m", description: "Focused build", icon: Coins },
  { value: "1m_2_5m", label: "R1m – R2.5m", description: "Full platform", icon: Banknote },
  { value: "2_5m_plus", label: "R2.5m+", description: "National-scale", icon: Gem },
  { value: "unsure", label: "Not sure yet", description: "Let our AI price it", icon: InfinityIcon },
];

export const TALENT_ROLES: SelectOption[] = [
  { value: "frontend", label: "Frontend engineer", icon: LineChart },
  { value: "backend", label: "Backend engineer", icon: Database },
  { value: "fullstack", label: "Full-stack engineer", icon: Boxes },
  { value: "ml", label: "ML / Data scientist", icon: Activity },
  { value: "data", label: "Data engineer", icon: Database },
  { value: "devops", label: "DevOps / Infra", icon: Factory },
];

export const TALENT_EXPERIENCE: SelectOption[] = [
  { value: "1", label: "0 – 2 years", description: "Early career", icon: Rocket },
  { value: "3", label: "3 – 5 years", description: "Mid-level", icon: CalendarClock },
  { value: "6", label: "6 – 9 years", description: "Senior", icon: CalendarRange },
  { value: "10", label: "10+ years", description: "Staff / Principal", icon: Gem },
];

export const TALENT_SKILLS: string[] = [
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "Django",
  "Go",
  "Rust",
  "PostgreSQL",
  "Supabase",
  "TensorFlow",
  "PyTorch",
  "LLMs / RAG",
  "Computer Vision",
  "Data Pipelines",
  "AWS",
  "GCP",
  "Docker",
  "Kubernetes",
  "GIS / Geospatial",
];

export function optionLabel(options: SelectOption[], value: string | null): string | null {
  if (!value) return null;
  return options.find((option) => option.value === value)?.label ?? value;
}
