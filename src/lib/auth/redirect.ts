import type { OnboardingStatus, UserRole } from "./types";

export function getOnboardingPath(role: UserRole): string {
  return role === "talent" ? "/onboarding/talent" : "/onboarding/client";
}

export function getDashboardPath(role: UserRole): string {
  return role === "talent" ? "/dashboard/talent" : "/dashboard/client";
}

export function getPostAuthRedirect(
  role: UserRole,
  onboardingStatus: OnboardingStatus
): string {
  if (onboardingStatus === "complete") {
    return getDashboardPath(role);
  }
  return getOnboardingPath(role);
}

export function signupRoleToUserRole(signupRole?: string): UserRole {
  return signupRole === "developer" ? "talent" : "client";
}
