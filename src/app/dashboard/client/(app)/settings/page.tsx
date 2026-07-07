import { Settings } from "lucide-react";

import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function SettingsPage() {
  return (
    <ComingSoon
      title="Settings"
      description="Manage your account, team access, and notification preferences."
      icon={Settings}
      points={[
        "Company and contact details",
        "Team members and access roles",
        "Notification and email preferences",
        "Security and sign-in options",
      ]}
    />
  );
}
