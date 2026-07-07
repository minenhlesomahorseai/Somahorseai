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
  | "matching"
  | "in_build"
  | "monitoring"
  | "delivered";

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
