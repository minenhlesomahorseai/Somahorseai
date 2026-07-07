import type { SupabaseClient } from "@supabase/supabase-js";

import type { AvailableDeveloper, ClientProject } from "./types";

const PROJECT_COLUMNS =
  "id, title, summary, status, sector, budget_range, timeline, scope, matched_team, created_at, updated_at";

/**
 * Reads the certified, available developer pool via the SECURITY DEFINER RPC
 * (migration 004). Returns [] if the RPC has not been applied yet so the
 * dashboard degrades gracefully instead of crashing.
 */
export async function fetchAvailableDevelopers(
  supabase: SupabaseClient
): Promise<AvailableDeveloper[]> {
  const { data, error } = await supabase.rpc("list_available_developers");
  if (error || !data) {
    return [];
  }
  return data as AvailableDeveloper[];
}

export async function fetchClientProjects(
  supabase: SupabaseClient,
  clientId: string
): Promise<ClientProject[]> {
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_COLUMNS)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }
  return data as ClientProject[];
}
