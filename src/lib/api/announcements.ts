import { apiRequest, type ApiRequestOptions } from "@/lib/api/client";
import type { SuccessResponse } from "@/lib/api/operation-types";

/** The admin-controlled announcement bar above the site header (`/api/v1/announcements`). */

type ActiveOperation = "active_announcements_api_v1_announcements_active_get";

export type PublicAnnouncementBars = SuccessResponse<ActiveOperation>;
export type AnnouncementBar = PublicAnnouncementBars["bars"][number];
export type AnnouncementItem = AnnouncementBar["items"][number];
export type AnnouncementStyle = AnnouncementBar["style"];
export type AnnouncementCoupon = NonNullable<AnnouncementItem["coupon"]>;

/** Bars live right now (schedule and coupon validity applied by the API; page and audience by the storefront). */
export function listActiveAnnouncements(options?: ApiRequestOptions): Promise<PublicAnnouncementBars> {
  return apiRequest("GET", "/api/v1/announcements/active", { ...options, query: { lang: "ar" } });
}
