import { ApiError, apiRequest } from "@/lib/api/client";
import { refreshOnce } from "@/lib/auth/client";

/** Where to send the browser. The legacy token itself never reaches JavaScript. */
export type LmsLaunchResult = { mode: "cookie" | "login"; redirectUrl: string };

const LAUNCH_PATH = "/api/lms/launch";

/**
 * Asks this app for the LMS hand-off (`app/api/lms/launch`), which also sets the LMS session
 * cookie. An expired access token is renewed once and the call repeated.
 */
export async function launchLms(entitlementId: string): Promise<LmsLaunchResult> {
  const options = { body: { entitlementId }, sameOrigin: true, credentials: "same-origin" as const };
  try {
    return await apiRequest<LmsLaunchResult>("POST", LAUNCH_PATH, options);
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 401)) throw error;
    if (!(await refreshOnce())) throw error;
    return apiRequest<LmsLaunchResult>("POST", LAUNCH_PATH, options);
  }
}

/** Product types whose access is delivered by the LMS (the rest open their catalog page). */
export const LMS_PRODUCT_TYPES = new Set(["course", "diploma", "package"]);
