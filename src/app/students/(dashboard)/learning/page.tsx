import { redirect } from "next/navigation";

import { routes } from "@/config/routes";

/**
 * Where the LMS (lms.emasteryacademy.com) sends students back to: its back arrow, and sign-in
 * after its session ends. The programs list lives at «تعلّمي».
 */
export default function Page() {
  redirect(routes.studentAccess);
}
