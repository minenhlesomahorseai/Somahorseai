"use server";

import { revalidatePath } from "next/cache";

import { isAdminUser } from "@/lib/auth/admin";
import {
  createInterviewProposal,
  respondToInterviewProposal,
} from "@/lib/interviews/service";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function authedAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!(await isAdminUser(supabase, user)) || !user) {
    throw new Error("Not authorized");
  }
  const writer = createAdminClient();
  if (!writer) throw new Error("Interview scheduling is not configured.");
  return { user, writer };
}

export async function proposeAdminInterview(
  talentId: string,
  input: {
    startsAt: string;
    note?: string | null;
    meetingUrl?: string | null;
  }
): Promise<void> {
  const { user, writer } = await authedAdmin();
  await createInterviewProposal({
    writer,
    talentId,
    proposedBy: user.id,
    proposerRole: "admin",
    startsAt: input.startsAt,
    note: input.note,
    meetingUrl: input.meetingUrl,
  });
  revalidatePath(`/admin/interviews/${talentId}`);
  revalidatePath("/admin");
  revalidatePath("/onboarding/talent");
}

export async function respondAdminInterview(
  talentId: string,
  proposalId: string,
  accept: boolean,
  meetingUrl?: string | null
): Promise<void> {
  const { writer } = await authedAdmin();
  await respondToInterviewProposal({
    writer,
    talentId,
    proposalId,
    responderRole: "admin",
    accept,
    meetingUrl,
  });
  revalidatePath(`/admin/interviews/${talentId}`);
  revalidatePath("/admin");
  revalidatePath("/onboarding/talent");
}

