export interface DashboardNotification {
  id: string;
  project_id: string | null;
  type: string;
  title: string;
  message: string;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}
