export const SOLUTION_TYPES = [
  "traceability",
  "quality_compliance",
  "yield_intelligence",
  "logistics_distribution",
  "farmer_records",
  "farmer_credit",
  "custom_ai",
] as const;

export type SolutionType = (typeof SOLUTION_TYPES)[number];
export type IntakeStage =
  | "discovering"
  | "proposal_ready"
  | "checkout"
  | "converted"
  | "archived";
export type ProjectComplexity = "focused" | "standard" | "complex";

export interface IntakeState {
  problemStatement: string;
  businessOutcome: string;
  affectedUsers: string[];
  currentProcess: string;
  painPoints: string[];
  dataSources: string[];
  integrations: string[];
  constraints: string[];
  connectivity: string;
  complianceNeeds: string[];
  successMeasures: string[];
  urgency: string;
  solutionType: SolutionType | null;
  complexity: ProjectComplexity;
  missingInformation: string[];
  confidence: number;
}

export interface ProposalMilestone {
  title: string;
  description: string;
  durationWeeks: number;
}

export interface ProjectProposal {
  version: 1;
  title: string;
  summary: string;
  problem: string;
  outcome: string;
  solutionType: SolutionType;
  solutionName: string;
  deliveryFormat:
    | "web_application"
    | "mobile_application"
    | "offline_first_system"
    | "data_platform"
    | "ai_service"
    | "integration"
    | "hybrid_system";
  approach: string;
  components: string[];
  milestones: ProposalMilestone[];
  timelineWeeks: number;
  buildFeeZar: number;
  depositZar: number;
  monthlyFeeZar: number;
  requiredRoles: string[];
  assumptions: string[];
  successMeasures: string[];
}

export interface IntakeTurn {
  reply: string;
  asksQuestion: boolean;
  stage: "discovering" | "proposal_ready";
  state: IntakeState;
  proposal: ProjectProposal | null;
}

export interface ProposedTeamMember {
  id: string;
  name: string;
  role: string;
  matchScore: number;
  reason: string;
}

export interface ProposedTeam {
  rationale: string;
  team: ProposedTeamMember[];
  poolSize?: number;
}

export interface IntakeConversation {
  id: string;
  title: string;
  stage: IntakeStage;
  question_count: number;
  intake_state: IntakeState;
  proposal: ProjectProposal | null;
  proposed_team: ProposedTeamMember[];
  match_rationale: string | null;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

export const EMPTY_INTAKE_STATE: IntakeState = {
  problemStatement: "",
  businessOutcome: "",
  affectedUsers: [],
  currentProcess: "",
  painPoints: [],
  dataSources: [],
  integrations: [],
  constraints: [],
  connectivity: "",
  complianceNeeds: [],
  successMeasures: [],
  urgency: "",
  solutionType: null,
  complexity: "standard",
  missingInformation: [],
  confidence: 0,
};
