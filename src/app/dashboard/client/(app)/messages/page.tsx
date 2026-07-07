import { MessagesSquare } from "lucide-react";

import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function MessagesPage() {
  return (
    <ComingSoon
      title="Messages"
      description="Your single thread with the Project Management agent — and a human when one is needed."
      icon={MessagesSquare}
      points={[
        "Proactive updates from your Project Management agent",
        "Ask anything about scope, timeline, or delivery",
        "Scope-change requests handled and re-quoted automatically",
        "Escalation to a human for genuine exceptions",
      ]}
    />
  );
}
