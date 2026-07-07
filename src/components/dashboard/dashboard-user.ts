export interface DashboardUser {
  fullName: string | null;
  firstName: string | null;
  company: string | null;
  email: string | null;
  initials: string;
}

export function buildInitials(name: string | null, email: string | null): string {
  const source = (name ?? email ?? "").trim();
  if (!source) return "SA";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}
