import { NextResponse } from "next/server";

import { generateIntakeTurn } from "@/lib/ai/intake";
import type { ChatMessage } from "@/lib/ai/provider";
import { getClientContextForApi } from "@/lib/dashboard/session";
import { normalizeIntakeState } from "@/lib/projects/pricing";
import type {
  IntakeConversation,
  IntakeStage,
  ProjectProposal,
  ProposedTeamMember,
} from "@/lib/projects/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const DEFAULT_TITLE = "New project intake";

interface IntakeBody {
  conversationId?: string;
  content?: string;
  start?: boolean;
}

interface ConversationRow {
  id: string;
  client_id: string;
  title: string;
  stage: IntakeStage;
  question_count: number;
  intake_state: unknown;
  proposal: ProjectProposal | null;
  proposed_team: ProposedTeamMember[] | null;
  match_rationale: string | null;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

interface MessageRow {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

function asConversation(row: ConversationRow): IntakeConversation {
  return {
    id: row.id,
    title: row.title,
    stage: row.stage,
    question_count: row.question_count,
    intake_state: normalizeIntakeState(row.intake_state),
    proposal: row.proposal,
    proposed_team: Array.isArray(row.proposed_team) ? row.proposed_team : [],
    match_rationale: row.match_rationale,
    project_id: row.project_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function getOwnedConversation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clientId: string,
  conversationId: string
) {
  const { data, error } = await supabase
    .from("intake_conversations")
    .select(
      "id, client_id, title, stage, question_count, intake_state, proposal, proposed_team, match_rationale, project_id, created_at, updated_at"
    )
    .eq("id", conversationId)
    .eq("client_id", clientId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as ConversationRow | null;
}

async function getConversationMessages(
  supabase: Awaited<ReturnType<typeof createClient>>,
  conversationId: string
) {
  const { data, error } = await supabase
    .from("intake_messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as MessageRow[];
}

async function saveMessage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  metadata: Record<string, unknown> = {}
) {
  const trimmed = content.trim();
  if (!trimmed) return;

  const { error } = await supabase.from("intake_messages").insert({
    conversation_id: conversationId,
    role,
    content: trimmed,
    metadata,
  });
  if (error) throw new Error(error.message);
}

/** Returns a saved conversation, its AI memory, proposal, and messages. */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const conversationId = new URL(request.url).searchParams.get("conversationId");
  if (!conversationId) {
    return NextResponse.json({ error: "Missing conversation ID" }, { status: 400 });
  }

  try {
    const conversation = await getOwnedConversation(supabase, user.id, conversationId);
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    const messages = await getConversationMessages(supabase, conversation.id);
    return NextResponse.json({ conversation: asConversation(conversation), messages });
  } catch (error) {
    console.error("Could not load intake conversation", error);
    return NextResponse.json({ error: "Could not load that saved intake." }, { status: 500 });
  }
}

/** Saves the client turn immediately, generates one reliable structured turn, then saves both reply and AI state. */
export async function POST(request: Request) {
  const context = await getClientContextForApi();
  if (!context) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: IntakeBody;
  try {
    body = (await request.json()) as IntakeBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const content = body.content?.trim() ?? "";
  const isGreeting = body.start === true && !content;
  if (!content && !isGreeting) {
    return NextResponse.json({ error: "Write a message to continue." }, { status: 400 });
  }
  if (content.length > 8_000) {
    return NextResponse.json({ error: "Messages must be under 8,000 characters." }, { status: 400 });
  }

  const supabase = await createClient();
  const writer = createAdminClient();
  if (!writer) {
    return NextResponse.json({ error: "Project intake storage is not configured." }, { status: 503 });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    let conversation = body.conversationId
      ? await getOwnedConversation(supabase, user.id, body.conversationId)
      : null;

    if (body.conversationId && !conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    if (conversation?.project_id || conversation?.stage === "converted") {
      return NextResponse.json(
        { error: "This intake has already become a project. Start a new chat for another project." },
        { status: 409 }
      );
    }

    if (!conversation) {
      const { data, error } = await writer
        .from("intake_conversations")
        .insert({
          client_id: user.id,
          title: content ? content.slice(0, 80) : DEFAULT_TITLE,
          stage: "discovering",
        })
        .select(
          "id, client_id, title, stage, question_count, intake_state, proposal, proposed_team, match_rationale, project_id, created_at, updated_at"
        )
        .single();
      if (error || !data) throw new Error(error?.message ?? "Could not start a conversation");
      conversation = data as ConversationRow;
    }

    if (content) {
      await saveMessage(writer as Awaited<ReturnType<typeof createClient>>, conversation.id, "user", content);
      const conversationUpdate: Record<string, unknown> = {
        proposed_team: [],
        match_rationale: null,
      };
      if (conversation.title === DEFAULT_TITLE) {
        conversationUpdate.title = content.slice(0, 80);
      }
      await writer
        .from("intake_conversations")
        .update(conversationUpdate)
        .eq("id", conversation.id)
        .eq("client_id", user.id);
    }

    const storedMessages = await getConversationMessages(
      writer as Awaited<ReturnType<typeof createClient>>,
      conversation.id
    );
    const history: ChatMessage[] = storedMessages.map(({ role, content: message }) => ({
      role,
      content: message,
    }));
    const turn = await generateIntakeTurn({
      context,
      messages: history,
      previousState: normalizeIntakeState(conversation.intake_state),
      questionCount: conversation.question_count,
    });
    const questionCount = Math.min(
      10,
      conversation.question_count + (turn.asksQuestion ? 1 : 0)
    );

    await saveMessage(writer as Awaited<ReturnType<typeof createClient>>, conversation.id, "assistant", turn.reply, {
      stage: turn.stage,
      question_count: questionCount,
      intake_state: turn.state,
      proposal_ready: Boolean(turn.proposal),
    });

    const { error: updateError } = await writer
      .from("intake_conversations")
      .update({
        stage: turn.stage,
        question_count: questionCount,
        intake_state: turn.state,
        proposal: turn.proposal,
        proposed_team: [],
        match_rationale: null,
      })
      .eq("id", conversation.id)
      .eq("client_id", user.id);
    if (updateError) throw new Error(updateError.message);

    return new Response(turn.reply, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Intake-Conversation-Id": conversation.id,
      },
    });
  } catch (error) {
    console.error("Intake turn failed", error);
    return NextResponse.json(
      {
        error:
          "Your message was saved, but the intake agent could not finish its reply. Please try again; your context is still here.",
      },
      { status: 502 }
    );
  }
}
