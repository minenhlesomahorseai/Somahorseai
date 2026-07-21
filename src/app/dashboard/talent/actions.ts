"use server";

import { revalidatePath } from "next/cache";

import { fetchProfile } from "@/lib/auth/profile";
import { fetchTalentOnboarding } from "@/lib/onboarding/data";
import { createClient } from "@/lib/supabase/server";

export async function setTalentAvailability(formData: FormData) {
  const requested = formData.get("availability");
  if (requested !== "available" && requested !== "unavailable") {
    throw new Error("Invalid availability status");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const [profile, talent] = await Promise.all([
    fetchProfile(supabase, user.id),
    fetchTalentOnboarding(supabase, user.id),
  ]);
  if (profile?.role !== "talent" || talent?.stage !== "approved") {
    throw new Error("Only certified talent can change availability");
  }

  const { data: activeAssignments, error: assignmentError } = await supabase
    .from("project_assignments")
    .select("id")
    .eq("talent_id", user.id)
    .in("status", ["assigned", "active"])
    .limit(1);
  if (assignmentError) throw new Error(assignmentError.message);
  if (requested === "available" && activeAssignments?.length) {
    throw new Error("You are already assigned to an active project");
  }

  const { error } = await supabase
    .from("talent_onboarding")
    .update({ availability_status: requested })
    .eq("id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/talent");
}
