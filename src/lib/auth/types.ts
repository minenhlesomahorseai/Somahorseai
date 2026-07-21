export type UserRole = "client" | "talent";
export type OnboardingStatus = "pending" | "complete";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole;
  onboarding_status: OnboardingStatus;
}

export interface ClientOnboarding {
  id: string;
  current_step: number;
  company_name: string | null;
  sector: string | null;
  project_type: string | null;
  problem: string | null;
  timeline: string | null;
  budget_range: string | null;
  submitted: boolean;
  welcome_email_sent: boolean;
}

export type TalentStage =
  | "profile"
  | "pending_review"
  | "assessment"
  | "assessment_review"
  | "interview"
  | "interview_review"
  | "approved"
  | "rejected";

export interface TalentAssessment {
  problem_solving?: string;
  technical_build?: string;
  agri_context?: string;
}

export interface TalentOnboarding {
  id: string;
  current_step: number;
  stage: TalentStage;
  headline: string | null;
  primary_role: string | null;
  years_experience: number | null;
  skills: string[];
  bio: string | null;
  portfolio_url: string | null;
  github_url: string | null;
  country: string | null;
  agri_experience: string | null;
  assessment: TalentAssessment | null;
  admin_notes: string | null;
  welcome_email_sent: boolean;
  availability_status: "available" | "unavailable";
}

// ---------------------------------------------------------------------------
// AI assessment
// ---------------------------------------------------------------------------
export type AssessmentStatus =
  | "ready"
  | "in_progress"
  | "submitted"
  | "graded"
  | "disqualified"
  | "error";

export type AssessmentQuestionType = "multiple_choice" | "scenario" | "problem";

export interface AssessmentOption {
  id: string;
  text: string;
}

export interface AssessmentQuestion {
  id: string;
  type: AssessmentQuestionType;
  prompt: string;
  /** Present for multiple_choice and scenario questions. */
  options?: AssessmentOption[];
  /** Short label of the skill/area this question probes. */
  focus?: string;
}

export type AssessmentAnswers = Record<string, string>;

export interface AssessmentQuestionEvaluation {
  id: string;
  score: number;
  max: number;
  verdict: string;
  feedback: string;
}

export interface AssessmentRecord {
  id: string;
  talent_id: string;
  token: string;
  status: AssessmentStatus;
  questions: AssessmentQuestion[];
  answers: AssessmentAnswers;
  time_limit_seconds: number;
  score: number | null;
  max_score: number | null;
  evaluation: AssessmentQuestionEvaluation[] | null;
  overall_feedback: string | null;
  recommendation: string | null;
  paste_flags: number;
  tab_violations: number;
  disqualified_reason: string | null;
  started_at: string | null;
  submitted_at: string | null;
  graded_at: string | null;
}
