import { Activity } from "lucide-react";

import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function MonitoringPage() {
  return (
    <ComingSoon
      title="Monitoring"
      description="Watch every delivered system stay healthy. Our Monitoring & Intelligence agent catches drift before you notice it."
      icon={Activity}
      points={[
        "Live health and performance of each delivered system",
        "Drift detection with automatic fixes and plain-language alerts",
        "Monthly monitoring reports and uptime history",
        "Recurring monitoring revenue tracked per system",
      ]}
    />
  );
}
