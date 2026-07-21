export interface AvailableDeveloper {
  id: string;
  full_name: string | null;
  headline: string | null;
  primary_role: string | null;
  years_experience: number | null;
  skills: string[];
  country: string | null;
  agri_experience: string | null;
}

export type ProjectStatus =
  | "scoping"
  | "awaiting_payment"
  | "matching"
  | "in_build"
  | "monitoring"
  | "delivered"
  | "cancelled";

export interface ClientProject {
  id: string;
  title: string;
  summary: string | null;
  status: ProjectStatus;
  sector: string | null;
  budget_range: string | null;
  timeline: string | null;
  scope: string | null;
  matched_team: string[] | null;
  solution_type: string | null;
  delivery_format: string | null;
  proposal: import("@/lib/projects/types").ProjectProposal | null;
  timeline_weeks: number | null;
  build_fee_amount: number | null;
  deposit_amount: number | null;
  monthly_fee_amount: number | null;
  currency: string;
  payment_status: "not_required" | "pending" | "paid" | "failed" | "refunded";
  paddle_transaction_id: string | null;
  paid_at: string | null;
  started_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientContext {
  fullName: string | null;
  firstName: string | null;
  companyName: string | null;
  sector: string | null;
  projectType: string | null;
  problem: string | null;
  timeline: string | null;
  budgetRange: string | null;
}
