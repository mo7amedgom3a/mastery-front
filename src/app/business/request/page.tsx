import { redirect } from "next/navigation";

import { routes } from "@/config/routes";
import { REQUEST_STEPS } from "@/features/business-request/model/steps";

export default function Page() {
  redirect(routes.businessRequest(REQUEST_STEPS[0].id));
}
