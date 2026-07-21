import type {
  IntakeState,
  ProjectComplexity,
  ProjectProposal,
  SolutionType,
} from "./types";
import { EMPTY_INTAKE_STATE, SOLUTION_TYPES } from "./types";

interface PriceBand {
  name: string;
  buildMin: number;
  buildMax: number;
  monthlyMin: number;
  monthlyMax: number;
}

export const SOLUTION_PRICING: Record<SolutionType, PriceBand> = {
  traceability: {
    name: "Produce traceability and visibility",
    buildMin: 180_000,
    buildMax: 350_000,
    monthlyMin: 8_000,
    monthlyMax: 20_000,
  },
  quality_compliance: {
    name: "Quality tracking and compliance",
    buildMin: 150_000,
    buildMax: 300_000,
    monthlyMin: 8_000,
    monthlyMax: 18_000,
  },
  yield_intelligence: {
    name: "Yield intelligence and forecasting",
    buildMin: 200_000,
    buildMax: 400_000,
    monthlyMin: 10_000,
    monthlyMax: 25_000,
  },
  logistics_distribution: {
    name: "Logistics and distribution",
    buildMin: 180_000,
    buildMax: 350_000,
    monthlyMin: 8_000,
    monthlyMax: 20_000,
  },
  farmer_records: {
    name: "Farmer records and bookkeeping",
    buildMin: 150_000,
    buildMax: 250_000,
    monthlyMin: 7_500,
    monthlyMax: 15_000,
  },
  farmer_credit: {
    name: "Farmer credit and financial intelligence",
    buildMin: 250_000,
    buildMax: 500_000,
    monthlyMin: 15_000,
    monthlyMax: 30_000,
  },
  custom_ai: {
    name: "Custom AI solution",
    buildMin: 150_000,
    buildMax: 500_000,
    monthlyMin: 10_000,
    monthlyMax: 30_000,
  },
};

const COMPLEXITY_POSITION: Record<ProjectComplexity, number> = {
  focused: 0.25,
  standard: 0.55,
  complex: 0.85,
};

const TIMELINE_WEEKS: Record<ProjectComplexity, number> = {
  focused: 6,
  standard: 9,
  complex: 13,
};

function roundTo(value: number, interval: number) {
  return Math.round(value / interval) * interval;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function asText(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asStrings(value: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(value)) return fallback;
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, 12);
}

export function asSolutionType(value: unknown): SolutionType | null {
  return typeof value === "string" && SOLUTION_TYPES.includes(value as SolutionType)
    ? (value as SolutionType)
    : null;
}

export function asComplexity(value: unknown): ProjectComplexity {
  return value === "focused" || value === "complex" ? value : "standard";
}

export function normalizeIntakeState(value: unknown): IntakeState {
  const raw = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const confidence = Number(raw.confidence);
  return {
    problemStatement: asText(raw.problemStatement),
    businessOutcome: asText(raw.businessOutcome),
    affectedUsers: asStrings(raw.affectedUsers),
    currentProcess: asText(raw.currentProcess),
    painPoints: asStrings(raw.painPoints),
    dataSources: asStrings(raw.dataSources),
    integrations: asStrings(raw.integrations),
    constraints: asStrings(raw.constraints),
    connectivity: asText(raw.connectivity),
    complianceNeeds: asStrings(raw.complianceNeeds),
    successMeasures: asStrings(raw.successMeasures),
    urgency: asText(raw.urgency),
    solutionType: asSolutionType(raw.solutionType),
    complexity: asComplexity(raw.complexity),
    missingInformation: asStrings(raw.missingInformation),
    confidence: Number.isFinite(confidence) ? clamp(confidence, 0, 100) : 0,
  };
}

export function mergeIntakeState(previous: unknown, next: unknown): IntakeState {
  const before = normalizeIntakeState(previous ?? EMPTY_INTAKE_STATE);
  const after = normalizeIntakeState(next);
  return {
    problemStatement: after.problemStatement || before.problemStatement,
    businessOutcome: after.businessOutcome || before.businessOutcome,
    affectedUsers: after.affectedUsers.length ? after.affectedUsers : before.affectedUsers,
    currentProcess: after.currentProcess || before.currentProcess,
    painPoints: after.painPoints.length ? after.painPoints : before.painPoints,
    dataSources: after.dataSources.length ? after.dataSources : before.dataSources,
    integrations: after.integrations.length ? after.integrations : before.integrations,
    constraints: after.constraints.length ? after.constraints : before.constraints,
    connectivity: after.connectivity || before.connectivity,
    complianceNeeds: after.complianceNeeds.length
      ? after.complianceNeeds
      : before.complianceNeeds,
    successMeasures: after.successMeasures.length
      ? after.successMeasures
      : before.successMeasures,
    urgency: after.urgency || before.urgency,
    solutionType: after.solutionType || before.solutionType,
    complexity: after.complexity || before.complexity,
    missingInformation: after.missingInformation,
    confidence: Math.max(before.confidence, after.confidence),
  };
}

export function priceSolution(solutionType: SolutionType, complexity: ProjectComplexity) {
  const band = SOLUTION_PRICING[solutionType];
  const position = COMPLEXITY_POSITION[complexity];
  const buildFeeZar = roundTo(
    band.buildMin + (band.buildMax - band.buildMin) * position,
    5_000
  );
  const monthlyFeeZar = roundTo(
    band.monthlyMin + (band.monthlyMax - band.monthlyMin) * position,
    500
  );
  const depositZar = Math.ceil(buildFeeZar / 3 / 1_000) * 1_000;
  return {
    solutionName: band.name,
    buildFeeZar,
    depositZar,
    monthlyFeeZar,
    timelineWeeks: TIMELINE_WEEKS[complexity],
  };
}

export function normalizeProposal(
  value: unknown,
  state: IntakeState
): ProjectProposal | null {
  const raw = value && typeof value === "object" ? (value as Record<string, unknown>) : null;
  if (!raw) return null;

  const solutionType = asSolutionType(raw.solutionType) ?? state.solutionType;
  if (!solutionType) return null;
  const complexity = asComplexity(raw.complexity ?? state.complexity);
  const price = priceSolution(solutionType, complexity);
  const deliveryFormats = [
    "web_application",
    "mobile_application",
    "offline_first_system",
    "data_platform",
    "ai_service",
    "integration",
    "hybrid_system",
  ] as const;
  const deliveryFormat = deliveryFormats.includes(raw.deliveryFormat as (typeof deliveryFormats)[number])
    ? (raw.deliveryFormat as ProjectProposal["deliveryFormat"])
    : "hybrid_system";

  const rawMilestones = Array.isArray(raw.milestones) ? raw.milestones : [];
  const milestones = rawMilestones
    .map((item) => {
      const milestone = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      const title = asText(milestone.title);
      if (!title) return null;
      return {
        title,
        description: asText(milestone.description, "Delivery and review"),
        durationWeeks: clamp(Number(milestone.durationWeeks) || 1, 1, 8),
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .slice(0, 6);

  const problem = asText(raw.problem, state.problemStatement);
  const outcome = asText(raw.outcome, state.businessOutcome);
  if (!problem || !outcome) return null;

  return {
    version: 1,
    title: asText(raw.title, price.solutionName).slice(0, 160),
    summary: asText(raw.summary, `A ${price.solutionName.toLowerCase()} solution for this operation.`),
    problem,
    outcome,
    solutionType,
    solutionName: price.solutionName,
    deliveryFormat,
    approach: asText(raw.approach, "Design, build, validate, deploy, and monitor the solution."),
    components: asStrings(raw.components, ["Core workflow", "Reporting", "Monitoring"]),
    milestones:
      milestones.length > 0
        ? milestones
        : [
            { title: "Discovery and design", description: "Confirm workflows and data.", durationWeeks: 1 },
            { title: "Build and validation", description: "Build and test the working solution.", durationWeeks: Math.max(3, price.timelineWeeks - 2) },
            { title: "Launch", description: "Deploy, train, and begin monitoring.", durationWeeks: 1 },
          ],
    timelineWeeks: price.timelineWeeks,
    buildFeeZar: price.buildFeeZar,
    depositZar: price.depositZar,
    monthlyFeeZar: price.monthlyFeeZar,
    requiredRoles: asStrings(raw.requiredRoles, ["Full-stack engineer", "AI/data engineer"]),
    assumptions: asStrings(raw.assumptions),
    successMeasures: asStrings(raw.successMeasures, state.successMeasures),
  };
}

export function formatZar(amount: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(amount);
}

