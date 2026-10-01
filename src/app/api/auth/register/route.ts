import type { NextRequest } from "next/server";

import { registerSchema } from "@/features/auth/model/schemas";
import { register } from "@/lib/api/auth";
import { backendOptions } from "@/lib/auth/server/forward";
import { rejectCrossOrigin } from "@/lib/auth/server/guard";
import {
  authError,
  authJson,
  backendFailure,
  emailRejected,
  isBackendStatus,
  readAuthBody,
} from "@/lib/auth/server/respond";

/** Creates the account. It does not sign in: the form goes on to the emailed-code step. */
export async function POST(request: NextRequest) {
  const denied = rejectCrossOrigin(request);
  if (denied) return denied;
  const body = await readAuthBody(request, registerSchema);
  if ("error" in body) return body.error;

  try {
    await register(body.data, backendOptions(request));
  } catch (error) {
    const rejected = emailRejected(error);
    if (rejected) return rejected;
    // The legacy system refused the registration (most often: the email already has an account).
    if (isBackendStatus(error, 400) || isBackendStatus(error, 401) || isBackendStatus(error, 422)) {
      return authError(
        400,
        "register_failed",
        "تعذّر إنشاء الحساب بهذه البيانات. إن كان لديك حساب بهذا البريد، سجّل الدخول.",
      );
    }
    return backendFailure("register", error);
  }
  return authJson({ registered: true });
}
