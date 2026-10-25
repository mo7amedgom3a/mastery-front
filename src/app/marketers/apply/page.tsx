import { redirect } from "next/navigation";

import { routes } from "@/config/routes";
import { APPLY_STEPS } from "@/features/marketer-application/model/steps";

export default function Page() {
  redirect(routes.marketersApply(APPLY_STEPS[0].id));
}
