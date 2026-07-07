import type {
  AssessmentAnswers,
  AssessmentQuestion,
  AssessmentQuestionEvaluation,
  AssessmentQuestionType,
} from "@/lib/auth/types";

import { completeOpenAiJson } from "./openai";

export interface CandidateProfile {
  fullName: string | null;
  headline: string | null;
  primaryRole: string | null;
  yearsExperience: number | null;
  skills: string[];
  bio: string | null;
  agriExperience: string | null;
  portfolioUrl: string | null;
  githubUrl: string | null;
}

const OPTION_IDS = ["a", "b", "c", "d", "e", "f"];

function profileBlock(p: CandidateProfile): string {
  const lines = [
    p.fullName ? `Name: ${p.fullName}` : null,
    p.primaryRole ? `Primary role: ${p.primaryRole}` : null,
    p.yearsExperience != null ? `Years of experience: ${p.yearsExperience}` : null,
    p.headline ? `Headline: ${p.headline}` : null,
    p.skills.length ? `Skills: ${p.skills.join(", ")}` : null,
    p.bio ? `Bio: ${p.bio}` : null,
    p.agriExperience ? `Agricultural / supply-chain context: ${p.agriExperience}` : null,
    p.portfolioUrl ? `Portfolio: ${p.portfolioUrl}` : null,
    p.githubUrl ? `GitHub: ${p.githubUrl}` : null,
  ].filter(Boolean);
  return lines.length ? lines.join("\n") : "No profile details were provided.";
}

const COMPANY_CONTEXT = `Somahorse.ai builds AI infrastructure for African agricultural supply chains —
produce traceability, yield/demand forecasting, data platforms, logistics, and live monitoring.
Engineers must be strong generalists who can reason about real systems and handle agricultural,
offline-first, and data-integrity constraints.`;

interface GeneratedQuestion {
  type: string;
  prompt: string;
  options?: { text: string }[];
  focus?: string;
}

interface GenerationResult {
  questions: GeneratedQuestion[];
}

function normalizeType(raw: string): AssessmentQuestionType | null {
  const t = raw.toLowerCase();
  if (t.includes("multiple") || t === "mc" || t === "choice") return "multiple_choice";
  if (t.includes("scenario")) return "scenario";
  if (t.includes("problem") || t.includes("open")) return "problem";
  return null;
}

/**
 * Generates a unique 10-question assessment for a candidate using OpenAI:
 * 3 multiple-choice, 3 scenario "pick the best response", 4 open problem/solution.
 */
export async function generateAssessmentQuestions(
  profile: CandidateProfile
): Promise<AssessmentQuestion[]> {
  const system = `You are the Certification Agent for Somahorse.ai. ${COMPANY_CONTEXT}
You design a fair, individualised technical assessment from a candidate's profile.
Return STRICT JSON only.`;

  const user = `Create a technical assessment tailored to this candidate.

CANDIDATE PROFILE
${profileBlock(profile)}

REQUIREMENTS
- Exactly 10 questions, in this order:
  - 3 questions of type "multiple_choice": a focused technical question with exactly 4 options, only one clearly best.
  - 3 questions of type "scenario": a short realistic engineering scenario (2-4 sentences) followed by "Which response is best?" with exactly 4 options.
  - 4 questions of type "problem": an open-ended problem the candidate solves in their own words (no options). These must invite explanation of approach, trade-offs, and reasoning.
- Tailor difficulty and topics to the candidate's stated role, seniority, and skills. Reference agricultural / supply-chain / offline-first contexts where natural.
- Each question has a short "focus" label (e.g. "System design", "PostgreSQL", "Data integrity").
- Do NOT reveal which option is correct. Do NOT number the prompts.

Return JSON of exactly this shape:
{
  "questions": [
    { "type": "multiple_choice", "prompt": "...", "focus": "...", "options": [ { "text": "..." }, { "text": "..." }, { "text": "..." }, { "text": "..." } ] },
    { "type": "scenario", "prompt": "...", "focus": "...", "options": [ { "text": "..." }, { "text": "..." }, { "text": "..." }, { "text": "..." } ] },
    { "type": "problem", "prompt": "...", "focus": "..." }
  ]
}`;

  const result = await completeOpenAiJson<GenerationResult>({
    system,
    user,
    temperature: 0.8,
  });

  const raw = Array.isArray(result.questions) ? result.questions : [];
  const questions: AssessmentQuestion[] = [];

  for (const q of raw) {
    const type = normalizeType(q.type ?? "");
    if (!type || !q.prompt) continue;
    const question: AssessmentQuestion = {
      id: `q${questions.length + 1}`,
      type,
      prompt: q.prompt.trim(),
      focus: q.focus?.trim() || undefined,
    };
    if ((type === "multiple_choice" || type === "scenario") && Array.isArray(q.options)) {
      question.options = q.options
        .slice(0, OPTION_IDS.length)
        .map((opt, i) => ({ id: OPTION_IDS[i], text: String(opt.text ?? "").trim() }))
        .filter((opt) => opt.text.length > 0);
      if (question.options.length < 2) continue;
    }
    questions.push(question);
  }

  if (questions.length < 6) {
    throw new Error("Assessment generation produced too few valid questions");
  }

  return questions;
}

interface GradingResult {
  evaluation: {
    id: string;
    score: number;
    max?: number;
    verdict?: string;
    feedback?: string;
  }[];
  overall_feedback?: string;
  recommendation?: string;
}

export interface GradedAssessment {
  score: number;
  maxScore: number;
  evaluation: AssessmentQuestionEvaluation[];
  overallFeedback: string;
  recommendation: string;
}

function answerText(
  question: AssessmentQuestion,
  answers: AssessmentAnswers
): string {
  const raw = answers[question.id];
  if (!raw) return "(no answer provided)";
  if (question.options) {
    const opt = question.options.find((o) => o.id === raw);
    return opt ? opt.text : raw;
  }
  return raw;
}

/**
 * Grades a submitted assessment with OpenAI. Each question is scored out of 10,
 * so the total is a clean 0-100. Returns per-question evaluation plus an overall
 * verdict and a pass/borderline/fail recommendation for the admin.
 */
export async function gradeAssessment(
  profile: CandidateProfile,
  questions: AssessmentQuestion[],
  answers: AssessmentAnswers
): Promise<GradedAssessment> {
  const system = `You are the Certification Agent for Somahorse.ai grading a technical assessment. ${COMPANY_CONTEXT}
Grade fairly and rigorously. For multiple-choice and scenario questions, judge whether the chosen option is the best one.
For open problems, judge correctness, depth of reasoning, trade-off awareness, and clarity. Return STRICT JSON only.`;

  const qaBlock = questions
    .map((q, i) => {
      const opts = q.options
        ? "\nOptions:\n" + q.options.map((o) => `  (${o.id}) ${o.text}`).join("\n")
        : "";
      return `Q${i + 1} [id=${q.id}] (${q.type}${q.focus ? `, ${q.focus}` : ""}): ${q.prompt}${opts}
Candidate answer: ${answerText(q, answers)}`;
    })
    .join("\n\n");

  const user = `Grade the following assessment by ${profile.fullName ?? "the candidate"}.

${qaBlock}

Score EACH question from 0 to 10 (max 10 each). Provide a one-line "verdict" and 1-3 sentences of "feedback" explaining the score for each.
Then give "overall_feedback" (a short paragraph explaining how the grading was done and the candidate's strengths/weaknesses) and a "recommendation" of exactly "pass", "borderline", or "fail".

Return JSON of exactly this shape:
{
  "evaluation": [ { "id": "q1", "score": 8, "max": 10, "verdict": "...", "feedback": "..." } ],
  "overall_feedback": "...",
  "recommendation": "pass"
}`;

  const result = await completeOpenAiJson<GradingResult>({
    system,
    user,
    temperature: 0.2,
  });

  const byId = new Map(
    (result.evaluation ?? []).map((e) => [e.id, e] as const)
  );

  const evaluation: AssessmentQuestionEvaluation[] = questions.map((q) => {
    const e = byId.get(q.id);
    const max = e?.max && e.max > 0 ? e.max : 10;
    const score = clamp(Number(e?.score ?? 0), 0, max);
    return {
      id: q.id,
      score,
      max,
      verdict: e?.verdict?.trim() || "Not evaluated",
      feedback: e?.feedback?.trim() || "No feedback was returned for this question.",
    };
  });

  const score = evaluation.reduce((sum, e) => sum + e.score, 0);
  const maxScore = evaluation.reduce((sum, e) => sum + e.max, 0);

  const recommendation = ["pass", "borderline", "fail"].includes(
    (result.recommendation ?? "").toLowerCase()
  )
    ? result.recommendation!.toLowerCase()
    : "borderline";

  return {
    score,
    maxScore,
    evaluation,
    overallFeedback:
      result.overall_feedback?.trim() ||
      "The assessment was graded across all questions.",
    recommendation,
  };
}

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}
