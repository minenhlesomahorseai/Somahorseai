import { CreditCard } from "lucide-react";

import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function BillingPage() {
  return (
    <ComingSoon
      title="Billing"
      description="Fixed-price builds and monthly monitoring fees, all in one place."
      icon={CreditCard}
      points={[
        "Fixed project quotes with the 60/40 developer split shown clearly",
        "Monthly monitoring invoices and recurring revenue summary",
        "Payment methods and billing history",
        "Downloadable invoices in ZAR",
      ]}
    />
  );
}
