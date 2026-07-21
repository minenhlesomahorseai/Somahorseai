import { aiConfigured } from "@/lib/ai/provider";
import { loadClientSession } from "@/lib/dashboard/session";
import { paddleCheckoutConfigured } from "@/lib/payments/paddle";
import { normalizeIntakeState } from "@/lib/projects/pricing";
import type { IntakeConversation } from "@/lib/projects/types";
import { createClient } from "@/lib/supabase/server";

import { ProjectIntakeChat } from "./project-intake-chat";

export default async function NewProjectPage() {
  const { context, userId } = await loadClientSession();
  const supabase = await createClient();
  const { data: conversations } = await supabase
    .from("intake_conversations")
    .select(
      "id, title, stage, question_count, intake_state, proposal, proposed_team, match_rationale, project_id, created_at, updated_at"
    )
    .eq("client_id", userId)
    .order("updated_at", { ascending: false })
    .limit(12);

  const initialConversations = (conversations ?? []).map((conversation) => ({
    ...conversation,
    intake_state: normalizeIntakeState(conversation.intake_state),
    proposed_team: Array.isArray(conversation.proposed_team) ? conversation.proposed_team : [],
  })) as IntakeConversation[];
  const initialConversation =
    initialConversations.find(
      (conversation) => conversation.stage !== "converted" && conversation.stage !== "archived"
    ) ?? null;
  const { data: initialMessages } = initialConversation
    ? await supabase
        .from("intake_messages")
        .select("id, role, content, created_at")
        .eq("conversation_id", initialConversation.id)
        .order("created_at", { ascending: true })
    : { data: [] };

  return (
    <ProjectIntakeChat
      context={context}
      aiReady={aiConfigured()}
      paymentsReady={paddleCheckoutConfigured()}
      initialConversation={initialConversation}
      initialConversations={initialConversations}
      initialMessages={initialMessages ?? []}
    />
  );
}
