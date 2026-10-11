import { redirect } from "next/navigation";

import { routes } from "@/config/routes";
import { ONBOARDING_STEPS } from "@/features/onboarding/model/steps";

export default function Page() {
  redirect(routes.studentOnboarding(ONBOARDING_STEPS[0].id));
}
