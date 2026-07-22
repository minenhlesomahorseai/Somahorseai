import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { WorkspaceMessage, WorkspaceMessageRead } from "@/lib/projects/workspace";

const ACTIVE_ASSIGNMENT_STATUSES = ["assigned", "active", "completed"];

export interface ClientDeveloperProject {
  id: string;
  title: string;
  status: string;
  assignmentStatus: string;
  role: string;
}

export interface ClientDeveloper {
  id: string;
  fullName: string;
  headline: string | null;
  primaryRole: string | null;
  yearsExperience: number | null;
  skills: string[];
  country: string | null;
  agriExperience: string | null;
  bio: string | null;
  portfolioUrl: string | null;
  githubUrl: string | null;
  matchScore: number;
  projects: ClientDeveloperProject[];
}

export interface ClientMonitoringProject {
  id: string;
  title: string;
  summary: string | null;
  status: string;
  progress: number;
  expectedCompletionAt: string | null;
  completedTasks: number;
  totalTasks: number;
  teamSize: number;
  currentMilestone: string | null;
  paymentDue: number;
  monthlyFee: number;
}

export interface ClientMessageMember {
  id: string;
  fullName: string;
  role: string;
  participantRole?: "client" | "talent";
}

export interface ClientMessageThread {
  projectId: string;
  projectTitle: string;
  projectStatus: string;
  members: ClientMessageMember[];
  messages: WorkspaceMessage[];
  reads: WorkspaceMessageRead[];
}

type ProjectRow = {
  id: string;
  title: string;
  summary: string | null;
  status: string;
  monthly_fee_amount: number | null;
};

type AssignmentRow = {
  project_id: string;
  talent_id: string;
  role: string;
  status: string;
  match_score: number;
};

export async function fetchClientDevelopers(
  admin: SupabaseClient,
  clientId: string
): Promise<ClientDeveloper[]> {
  const { data: rawProjects } = await admin
    .from("projects")
    .select("id, title, status")
    .eq("client_id", clientId);
  const projects = (rawProjects ?? []) as Array<Pick<ProjectRow, "id" | "title" | "status">>;
  if (!projects.length) return [];

  const projectById = new Map(projects.map((project) => [project.id, project]));
  const { data: rawAssignments } = await admin
    .from("project_assignments")
    .select("project_id, talent_id, role, status, match_score")
    .in("project_id", projects.map((project) => project.id))
    .in("status", ACTIVE_ASSIGNMENT_STATUSES);
  const assignments = (rawAssignments ?? []) as AssignmentRow[];
  const talentIds = [...new Set(assignments.map((assignment) => assignment.talent_id))];
  if (!talentIds.length) return [];

  const [{ data: profiles }, { data: talentRows }] = await Promise.all([
    admin.from("profiles").select("id, full_name").in("id", talentIds),
    admin
      .from("talent_onboarding")
      .select(
        "id, headline, primary_role, years_experience, skills, country, agri_experience, bio, portfolio_url, github_url"
      )
      .in("id", talentIds),
  ]);
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name as string | null]));
  const talentById = new Map((talentRows ?? []).map((talent) => [talent.id, talent]));

  return talentIds
    .map((talentId) => {
      const talent = talentById.get(talentId);
      const ownAssignments = assignments.filter((assignment) => assignment.talent_id === talentId);
      return {
        id: talentId,
        fullName: profileById.get(talentId) ?? "Certified developer",
        headline: (talent?.headline as string | null) ?? null,
        primaryRole: (talent?.primary_role as string | null) ?? ownAssignments[0]?.role ?? null,
        yearsExperience: (talent?.years_experience as number | null) ?? null,
        skills: (talent?.skills as string[] | null) ?? [],
        country: (talent?.country as string | null) ?? null,
        agriExperience: (talent?.agri_experience as string | null) ?? null,
        bio: (talent?.bio as string | null) ?? null,
        portfolioUrl: (talent?.portfolio_url as string | null) ?? null,
        githubUrl: (talent?.github_url as string | null) ?? null,
        matchScore: Math.max(...ownAssignments.map((assignment) => assignment.match_score), 0),
        projects: ownAssignments.flatMap((assignment) => {
          const project = projectById.get(assignment.project_id);
          return project
            ? [{
                id: project.id,
                title: project.title,
                status: project.status,
                assignmentStatus: assignment.status,
                role: assignment.role,
              }]
            : [];
        }),
      } satisfies ClientDeveloper;
    })
    .sort((a, b) => {
      const aActive = a.projects.some((project) => ["assigned", "active"].includes(project.assignmentStatus));
      const bActive = b.projects.some((project) => ["assigned", "active"].includes(project.assignmentStatus));
      return Number(bActive) - Number(aActive) || b.matchScore - a.matchScore;
    });
}

export async function fetchClientMonitoringProjects(
  admin: SupabaseClient,
  clientId: string
): Promise<ClientMonitoringProject[]> {
  const { data: rawProjects } = await admin
    .from("projects")
    .select("id, title, summary, status, monthly_fee_amount")
    .eq("client_id", clientId)
    .in("status", ["in_build", "monitoring", "delivered"])
    .order("updated_at", { ascending: false });
  const projects = (rawProjects ?? []) as ProjectRow[];
  if (!projects.length) return [];
  const ids = projects.map((project) => project.id);

  const [workspacesResult, milestonesResult, tasksResult, assignmentsResult] = await Promise.all([
    admin
      .from("project_workspaces")
      .select("project_id, progress_percent, expected_completion_at")
      .in("project_id", ids),
    admin
      .from("project_milestones")
      .select("id, project_id, title, sequence, status, payment_amount, payment_status")
      .in("project_id", ids)
      .order("sequence"),
    admin.from("project_tasks").select("project_id, status").in("project_id", ids),
    admin
      .from("project_assignments")
      .select("project_id, talent_id")
      .in("project_id", ids)
      .in("status", ACTIVE_ASSIGNMENT_STATUSES),
  ]);

  const workspaceByProject = new Map(
    (workspacesResult.data ?? []).map((workspace) => [workspace.project_id, workspace])
  );
  return projects.map((project) => {
    const milestones = (milestonesResult.data ?? []).filter((milestone) => milestone.project_id === project.id);
    const tasks = (tasksResult.data ?? []).filter((task) => task.project_id === project.id);
    const currentMilestone = milestones.find((milestone) => milestone.status !== "completed") ?? milestones.at(-1);
    return {
      id: project.id,
      title: project.title,
      summary: project.summary,
      status: project.status,
      progress: Number(workspaceByProject.get(project.id)?.progress_percent ?? (project.status === "delivered" ? 100 : 0)),
      expectedCompletionAt: workspaceByProject.get(project.id)?.expected_completion_at ?? null,
      completedTasks: tasks.filter((task) => task.status === "completed").length,
      totalTasks: tasks.length,
      teamSize: new Set(
        (assignmentsResult.data ?? [])
          .filter((assignment) => assignment.project_id === project.id)
          .map((assignment) => assignment.talent_id)
      ).size,
      currentMilestone: currentMilestone?.title ?? null,
      paymentDue: milestones
        .filter((milestone) => milestone.payment_status === "due")
        .reduce((sum, milestone) => sum + Number(milestone.payment_amount ?? 0), 0),
      monthlyFee: Number(project.monthly_fee_amount ?? 0),
    };
  });
}

export async function fetchClientMessageThreads(
  admin: SupabaseClient,
  clientId: string
): Promise<ClientMessageThread[]> {
  const { data: rawProjects } = await admin
    .from("projects")
    .select("id, title, status")
    .eq("client_id", clientId)
    .in("status", ["in_build", "monitoring", "delivered"])
    .order("updated_at", { ascending: false });
  const projects = (rawProjects ?? []) as Array<Pick<ProjectRow, "id" | "title" | "status">>;
  if (!projects.length) return [];
  const ids = projects.map((project) => project.id);

  const [assignmentsResult, messagesResult, readsResult] = await Promise.all([
    admin
      .from("project_assignments")
      .select("project_id, talent_id, role, status, match_score")
      .in("project_id", ids)
      .in("status", ACTIVE_ASSIGNMENT_STATUSES),
    admin
      .from("project_messages")
      .select("id, project_id, sender_id, sender_role, body, created_at")
      .in("project_id", ids)
      .order("created_at"),
    admin
      .from("project_message_reads")
      .select("project_id, user_id, last_read_at, updated_at")
      .in("project_id", ids),
  ]);
  const assignments = (assignmentsResult.data ?? []) as AssignmentRow[];
  const rawMessages = (messagesResult.data ?? []) as Array<Omit<WorkspaceMessage, "sender_name">>;
  const profileIds = [...new Set([
    clientId,
    ...assignments.map((assignment) => assignment.talent_id),
    ...rawMessages.map((message) => message.sender_id),
  ])];
  const { data: profiles } = await admin.from("profiles").select("id, full_name").in("id", profileIds);
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name as string | null]));

  return projects.map((project) => ({
    projectId: project.id,
    projectTitle: project.title,
    projectStatus: project.status,
    members: assignments
      .filter((assignment) => assignment.project_id === project.id)
      .map((assignment) => ({
        id: assignment.talent_id,
        fullName: profileById.get(assignment.talent_id) ?? "Certified developer",
        role: assignment.role,
        participantRole: "talent" as const,
      })),
    messages: rawMessages
      .filter((message) => message.project_id === project.id)
      .map((message) => ({
        ...message,
        sender_name:
          message.sender_role === "admin"
            ? "Somahorse control room"
            : profileById.get(message.sender_id) ?? (message.sender_role === "client" ? "You" : "Project developer"),
      })),
    reads: (readsResult.data ?? []).filter((read) => read.project_id === project.id) as WorkspaceMessageRead[],
  }));
}

export async function fetchTalentMessageThreads(
  admin: SupabaseClient,
  talentId: string
): Promise<ClientMessageThread[]> {
  const { data: ownAssignments } = await admin
    .from("project_assignments")
    .select("project_id")
    .eq("talent_id", talentId)
    .in("status", ACTIVE_ASSIGNMENT_STATUSES);
  const projectIds = [...new Set((ownAssignments ?? []).map((assignment) => assignment.project_id as string))];
  if (!projectIds.length) return [];

  const { data: rawProjects } = await admin
    .from("projects")
    .select("id, title, status, client_id, updated_at")
    .in("id", projectIds)
    .order("updated_at", { ascending: false });
  const projects = (rawProjects ?? []) as Array<{
    id: string;
    title: string;
    status: string;
    client_id: string;
  }>;
  if (!projects.length) return [];
  const ids = projects.map((project) => project.id);

  const [assignmentsResult, messagesResult, readsResult] = await Promise.all([
    admin
      .from("project_assignments")
      .select("project_id, talent_id, role, status, match_score")
      .in("project_id", ids)
      .in("status", ACTIVE_ASSIGNMENT_STATUSES),
    admin
      .from("project_messages")
      .select("id, project_id, sender_id, sender_role, body, created_at")
      .in("project_id", ids)
      .order("created_at"),
    admin
      .from("project_message_reads")
      .select("project_id, user_id, last_read_at, updated_at")
      .in("project_id", ids),
  ]);
  const assignments = (assignmentsResult.data ?? []) as AssignmentRow[];
  const rawMessages = (messagesResult.data ?? []) as Array<Omit<WorkspaceMessage, "sender_name">>;
  const profileIds = [...new Set([
    ...projects.map((project) => project.client_id),
    ...assignments.map((assignment) => assignment.talent_id),
    ...rawMessages.map((message) => message.sender_id),
  ])];
  const { data: profiles } = await admin.from("profiles").select("id, full_name").in("id", profileIds);
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name as string | null]));

  return projects.map((project) => ({
    projectId: project.id,
    projectTitle: project.title,
    projectStatus: project.status,
    members: [
      {
        id: project.client_id,
        fullName: profileById.get(project.client_id) ?? "Project client",
        role: "Project client",
        participantRole: "client" as const,
      },
      ...assignments
        .filter((assignment) => assignment.project_id === project.id)
        .map((assignment) => ({
          id: assignment.talent_id,
          fullName: profileById.get(assignment.talent_id) ?? "Certified talent",
          role: assignment.role,
          participantRole: "talent" as const,
        })),
    ],
    messages: rawMessages
      .filter((message) => message.project_id === project.id)
      .map((message) => ({
        ...message,
        sender_name:
          message.sender_role === "admin"
            ? "Somahorse control room"
            : profileById.get(message.sender_id) ?? (message.sender_role === "client" ? "Project client" : "Project teammate"),
      })),
    reads: (readsResult.data ?? []).filter((read) => read.project_id === project.id) as WorkspaceMessageRead[],
  }));
}
