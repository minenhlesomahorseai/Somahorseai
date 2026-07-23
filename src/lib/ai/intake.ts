import type { ChatMessage } from "./provider";
import { completeGeminiJson } from "./gemini-json";
import type { ClientContext } from "@/lib/dashboard/types";
import {
  EMPTY_INTAKE_STATE,
  type IntakeState,
  type IntakeTurn,
  type ProjectProposal,
  type SolutionType,
} from "@/lib/projects/types";
import {
  mergeIntakeState,
  normalizeProposal,
} from "@/lib/projects/pricing";

const INTAKE_MODEL =
  process.env.GEMINI_INTAKE_MODEL ?? "gemini-3.5-flash-lite";

const INTAKE_RESPONSE_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  properties: {
    reply: { type: "string" },
    asksQuestion: { type: "boolean" },
    stage: { type: "string", enum: ["discovering", "proposal_ready"] },
    state: {
      type: "object",
      additionalProperties: false,
      properties: {
        problemStatement: { type: "string" },
        businessOutcome: { type: "string" },
        affectedUsers: { type: "array", items: { type: "string" } },
        currentProcess: { type: "string" },
        painPoints: { type: "array", items: { type: "string" } },
        dataSources: { type: "array", items: { type: "string" } },
        integrations: { type: "array", items: { type: "string" } },
        constraints: { type: "array", items: { type: "string" } },
        connectivity: { type: "string" },
        complianceNeeds: { type: "array", items: { type: "string" } },
        successMeasures: { type: "array", items: { type: "string" } },
        urgency: { type: "string" },
        solutionType: {
          type: ["string", "null"],
          enum: [
            "traceability",
            "quality_compliance",
            "yield_intelligence",
            "logistics_distribution",
            "farmer_records",
            "farmer_credit",
            "custom_ai",
            null,
          ],
        },
        complexity: { type: "string", enum: ["focused", "standard", "complex"] },
        missingInformation: { type: "array", items: { type: "string" } },
        confidence: { type: "integer", minimum: 0, maximum: 100 },
      },
      required: [
        "problemStatement",
        "businessOutcome",
        "affectedUsers",
        "currentProcess",
        "painPoints",
        "dataSources",
        "integrations",
        "constraints",
        "connectivity",
        "complianceNeeds",
        "successMeasures",
        "urgency",
        "solutionType",
        "complexity",
        "missingInformation",
        "confidence",
      ],
    },
    proposal: {
      type: ["object", "null"],
      properties: {
        title: { type: "string" },
        summary: { type: "string" },
        problem: { type: "string" },
        outcome: { type: "string" },
        solutionType: { type: "string" },
        complexity: { type: "string", enum: ["focused", "standard", "complex"] },
        deliveryFormat: { type: "string" },
        approach: { type: "string" },
        components: { type: "array", items: { type: "string" } },
        milestones: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              durationWeeks: { type: "integer" },
            },
            required: ["title", "description", "durationWeeks"],
          },
        },
        requiredRoles: { type: "array", items: { type: "string" } },
        assumptions: { type: "array", items: { type: "string" } },
        successMeasures: { type: "array", items: { type: "string" } },
      },
    },
  },
  required: ["reply", "asksQuestion", "stage", "state", "proposal"],
};

interface RawIntakeTurn {
  reply?: unknown;
  asksQuestion?: unknown;
  stage?: unknown;
  state?: unknown;
  proposal?: unknown;
}

function contextBlock(context: ClientContext): string {
  return [
    context.companyName ? `Company: ${context.companyName}` : null,
    context.fullName ? `Contact: ${context.fullName}` : null,
    context.sector ? `Sector: ${context.sector}` : null,
    context.projectType ? `Initial interest: ${context.projectType}` : null,
    context.problem ? `Onboarding problem: ${context.problem}` : null,
    context.timeline ? `Initial timeline: ${context.timeline}` : null,
    context.budgetRange ? `Initial budget: ${context.budgetRange}` : null,
    context.countryCode ? `Client country code: ${context.countryCode}` : null,
    `Client display/payment preference: ${context.preferredCurrency}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function transcriptBlock(messages: ChatMessage[]): string {
  return messages
    .slice(-24)
    .map((message) => `${message.role === "assistant" ? "ASSISTANT" : "CLIENT"}: ${message.content}`)
    .join("\n\n");
}

function systemPrompt(context: ClientContext): string {
  return `You are Somahorse.ai's Intake and Scoping Agent for African agricultural supply chains.
You turn an enterprise's operational problem into a buildable, commercially honest project proposal.

KNOWN CLIENT CONTEXT
${contextBlock(context) || "No prior onboarding context."}

Currency rule: project pricing fields remain canonical ZAR accounting values.
The application converts and locks the client-facing checkout separately using
the saved currency above. Never relabel a ZAR number with another currency
symbol and never invent an exchange rate in the conversation.

SOLUTION TYPES
- traceability: farm-to-retailer origin, movement, proof, and visibility
- quality_compliance: quality standards, inspections, records, and compliance
- yield_intelligence: yield prediction, harvest planning, and risk alerts
- logistics_distribution: produce movement, delivery, routing, and coordination
- farmer_records: farmer activity, income, expenses, and operational records
- farmer_credit: financial history and credit intelligence (later-stage product)
- custom_ai: a problem outside the standard modules

BEHAVIOUR
- Be calm, warm, concise, and commercially serious. Speak to a non-technical executive.
- Never ask for information already present in the client context, saved state, or transcript.
- During discovery, ask exactly ONE focused question in the reply. Never bundle questions.
- Ask only what changes the proposed solution, scope, delivery risk, price tier, or team.
- Aim to finish in 5-9 questions and never exceed 10. If the instruction says FINALISE NOW, ask no question.
- Consider users, current workflow, scale, data, connectivity/offline needs, integrations, compliance,
  decision urgency, and measurable success. Skip anything irrelevant.
- Preserve facts already learned in state. Never erase a known fact just because it was not mentioned again.
- Mark proposal_ready only when the problem, desired outcome, operating context, and major constraints are clear.
- The proposal must describe a real deliverable: web app, mobile app, offline-first system, data platform,
  AI service, integration, or hybrid system. Keep milestones practical and the whole timeline under 16 weeks.
- Do not invent talent, payment completion, or work already underway.
- Do not include prices in the conversational reply. The platform applies the official pricing rules.
- Return JSON only in the requested structure.`;
}

function userPrompt({
  messages,
  previousState,
  questionCount,
  forceFinalize,
}: {
  messages: ChatMessage[];
  previousState: IntakeState;
  questionCount: number;
  forceFinalize: boolean;
}): string {
  return `SAVED STRUCTURED STATE
${JSON.stringify(previousState)}

QUESTIONS ALREADY ASKED: ${questionCount} of 10
${forceFinalize ? "FINALISE NOW. Use reasonable stated assumptions for any non-critical gap. Ask no further question." : "Continue discovery only if a material gap remains."}

CONVERSATION
${transcriptBlock(messages) || "The client has just opened a new project intake."}

Return one JSON object with:
- reply: 2-5 short sentences. If discovering, end with exactly one focused question. If ready, say the scope is ready and introduce the proposal below.
- asksQuestion: true only when reply contains the next discovery question.
- stage: discovering or proposal_ready.
- state: the complete updated structured state, including all facts learned so far.
- proposal: null while discovering. When ready, include title, summary, problem, outcome, solutionType,
  complexity (focused|standard|complex), deliveryFormat, approach, 3-6 components, 3-5 milestones
  with durationWeeks, requiredRoles, assumptions, and successMeasures.`;
}

function inferSolutionType(text: string): SolutionType {
  const value = text.toLowerCase();
  if (/trace|origin|farm.to.(shelf|retailer)|batch|lot/.test(value)) return "traceability";
  if (/quality|compliance|standard|inspection|audit/.test(value)) return "quality_compliance";
  if (/yield|forecast|harvest|predict/.test(value)) return "yield_intelligence";
  if (/logistic|deliver|route|distribution|transport/.test(value)) return "logistics_distribution";
  if (/bookkeep|expense|income|farmer record/.test(value)) return "farmer_records";
  if (/credit|loan|bankable|finance/.test(value)) return "farmer_credit";
  return "custom_ai";
}

function fallbackProposal(state: IntakeState, messages: ChatMessage[]): ProjectProposal {
  const lastClientMessage = [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
  const enrichedState: IntakeState = {
    ...state,
    problemStatement: state.problemStatement || lastClientMessage || "An agricultural operation needs a more reliable digital workflow.",
    businessOutcome: state.businessOutcome || "A faster, traceable operation with clear management visibility.",
    solutionType: state.solutionType ?? inferSolutionType(`${state.problemStatement} ${lastClientMessage}`),
  };
  return normalizeProposal(
    {
      title: "Agricultural operations solution",
      summary: enrichedState.businessOutcome,
      problem: enrichedState.problemStatement,
      outcome: enrichedState.businessOutcome,
      solutionType: enrichedState.solutionType,
      complexity: enrichedState.complexity,
      deliveryFormat: enrichedState.connectivity.toLowerCase().includes("offline")
        ? "offline_first_system"
        : "web_application",
      approach: "Map the operating workflow, build the core field and management experience, validate it with real users, then launch with monitoring.",
      components: ["Field data capture", "Operations dashboard", "Reporting and alerts", "Monitoring"],
      milestones: [
        { title: "Workflow and data design", description: "Confirm users, records, and success measures.", durationWeeks: 1 },
        { title: "Core system build", description: "Build the working operational product.", durationWeeks: 5 },
        { title: "Pilot and launch", description: "Test with real workflows, train users, and deploy.", durationWeeks: 2 },
      ],
      requiredRoles: ["Full-stack engineer", "Data and AI engineer"],
      assumptions: enrichedState.missingInformation,
      successMeasures: enrichedState.successMeasures,
    },
    enrichedState
  )!;
}

const FALLBACK_QUESTIONS = [
  "What operational problem should this project solve first?",
  "What business result would make this project a clear success?",
  "Who will use the solution day to day?",
  "How does the team handle this work today?",
  "Where are the biggest delays, errors, or losses in that process?",
  "What data or records already exist for this workflow?",
  "What connectivity should we design for in the places where people will use it?",
  "Which existing tools or systems should the solution connect to?",
  "Are there security, compliance, language, or operational constraints we must respect?",
  "Which measurable result should we use to judge the first successful launch?",
] as const;

function asList(value: string): string[] {
  return value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function fallbackIntakeTurn({
  messages,
  previousState,
  questionCount,
}: {
  messages: ChatMessage[];
  previousState: IntakeState;
  questionCount: number;
}): IntakeTurn {
  const latestAnswer = [...messages]
    .reverse()
    .find((message) => message.role === "user")
    ?.content.trim();
  const answerIndex = Math.max(0, questionCount - 1);
  const patch: Partial<IntakeState> = {};

  if (latestAnswer) {
    if (answerIndex === 0) patch.problemStatement = latestAnswer;
    if (answerIndex === 1) patch.businessOutcome = latestAnswer;
    if (answerIndex === 2) patch.affectedUsers = asList(latestAnswer);
    if (answerIndex === 3) patch.currentProcess = latestAnswer;
    if (answerIndex === 4) patch.painPoints = asList(latestAnswer);
    if (answerIndex === 5) patch.dataSources = asList(latestAnswer);
    if (answerIndex === 6) patch.connectivity = latestAnswer;
    if (answerIndex === 7) patch.integrations = asList(latestAnswer);
    if (answerIndex === 8) {
      patch.constraints = asList(latestAnswer);
      patch.complianceNeeds = asList(latestAnswer);
    }
    if (answerIndex >= 9) patch.successMeasures = asList(latestAnswer);
  }

  const state = mergeIntakeState(previousState, patch);
  if (!state.solutionType && state.problemStatement) {
    state.solutionType = inferSolutionType(state.problemStatement);
  }
  state.confidence = Math.max(
    state.confidence,
    Math.min(92, 15 + questionCount * 8)
  );

  if (questionCount >= 10) {
    return {
      reply:
        "I have enough to turn this into a clear delivery plan. Your proposed solution, team shape, timeline, and investment are ready below.",
      asksQuestion: false,
      stage: "proposal_ready",
      state,
      proposal: fallbackProposal(state, messages),
    };
  }

  const nextIndex = latestAnswer && questionCount === 0 ? 1 : questionCount;
  const question = FALLBACK_QUESTIONS[Math.min(nextIndex, FALLBACK_QUESTIONS.length - 1)];
  return {
    reply: `I’ve saved that context. ${question}`,
    asksQuestion: true,
    stage: "discovering",
    state,
    proposal: null,
  };
}

export async function generateIntakeTurn({
  context,
  messages,
  previousState = EMPTY_INTAKE_STATE,
  questionCount,
}: {
  context: ClientContext;
  messages: ChatMessage[];
  previousState?: IntakeState;
  questionCount: number;
}): Promise<IntakeTurn> {
  const forceFinalize = questionCount >= 10;
  let raw: RawIntakeTurn;
  try {
    raw = await completeGeminiJson<RawIntakeTurn>({
      system: systemPrompt(context),
      user: userPrompt({ messages, previousState, questionCount, forceFinalize }),
      temperature: forceFinalize ? 0.2 : 0.45,
      responseJsonSchema: INTAKE_RESPONSE_SCHEMA,
      model: INTAKE_MODEL,
      maxOutputTokens: 3_500,
      timeoutMs: 25_000,
      attempts: 1,
    });
  } catch (error) {
    console.warn("Gemini intake fell back to the durable question flow", error);
    return fallbackIntakeTurn({ messages, previousState, questionCount });
  }

  const state = mergeIntakeState(previousState, raw.state);
  const requestedReady = raw.stage === "proposal_ready" || forceFinalize;
  let proposal = requestedReady ? normalizeProposal(raw.proposal, state) : null;
  if (forceFinalize && !proposal) {
    proposal = fallbackProposal(state, messages);
  }

  const stage = proposal ? "proposal_ready" : "discovering";
  const asksQuestion = stage === "discovering";
  let reply = typeof raw.reply === "string" ? raw.reply.trim() : "";

  if (!reply) {
    reply = proposal
      ? "I have enough to turn this into a clear delivery plan. Your proposed solution, team shape, timeline, and investment are ready below."
      : "I’m building the scope carefully. What is the most important operational result this project must achieve?";
  }
  if (asksQuestion && !reply.includes("?")) {
    reply = `${reply} ${FALLBACK_QUESTIONS[Math.min(questionCount, FALLBACK_QUESTIONS.length - 1)]}`.trim();
  }

  return { reply, asksQuestion, stage, state, proposal };
}
