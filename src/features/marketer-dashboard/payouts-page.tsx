"use client";

import { MarketerEarnings } from "@/features/referrals/components/marketer-earnings";

/** Balance, payout requests and payout details (the same panel the referrals page used to show). */
export function MarketerPayoutsPage() {
  return (
    <div className="flex flex-col gap-4">
      <MarketerEarnings />
      <p className="m-0 text-sm text-fg-muted">
        نراجع طلبات الصرف ونحوّل المبلغ إلى وسيلة الدفع التي حفظتها. قد نحوّل جزءًا من المبلغ — والباقي يعود إلى رصيدك لتطلبه لاحقًا.
        العمولات التي تُسترد بعد صرفها تُخصم من رصيدك القادم.
      </p>
    </div>
  );
}
