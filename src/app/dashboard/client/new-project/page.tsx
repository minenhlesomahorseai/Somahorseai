import { aiConfigured } from "@/lib/ai/provider";
import { loadClientSession } from "@/lib/dashboard/session";

import { ProjectIntakeChat } from "./project-intake-chat";

export default async function NewProjectPage() {
  const { context } = await loadClientSession();
  return <ProjectIntakeChat context={context} aiReady={aiConfigured()} />;
}
