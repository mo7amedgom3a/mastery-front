import { queryOptions } from "@tanstack/react-query";

import type { ApiRequestContext } from "@/lib/api/client";
import { customerRequest, withAuthCookies, type AuthenticatedRequestOptions } from "@/lib/api/customers";
import type { QueryParams, RequestBody, SuccessResponse } from "@/lib/api/operation-types";
import { refreshOnce } from "@/lib/auth/client";
import type { components } from "@/types/openapi";

type AvailabilityOperation = "consultation_availability_api_v1_consultations_products__product_ref__availability_get";
type CreateBookingOperation = "create_booking_checkout_api_v1_consultations_bookings_post";
type MyBookingsOperation = "my_bookings_api_v1_consultations_bookings_me_get";
type BookingOperation = "booking_detail_api_v1_consultations_bookings__booking_id__get";
type JoinOperation = "join_booking_api_v1_consultations_bookings__booking_id__join_post";
type RecordingOperation = "booking_recording_api_v1_consultations_bookings__booking_id__recording_get";
type SessionAssetsOperation = "session_assets_api_v1_consultations_bookings__booking_id__assets_get";
type SessionAssetLinkOperation = "session_asset_link_api_v1_consultations_bookings__booking_id__assets__asset_id__get";
type ExpertProfileOperation = "expert_profile_api_v1_experts_me_get";
type ExpertSlotsOperation = "expert_slots_api_v1_experts_me_slots_get";
type CreateSlotsOperation = "create_expert_slots_api_v1_experts_me_slots_post";
type UpdateSlotOperation = "update_expert_slot_api_v1_experts_me_slots__slot_id__patch";
type CancelBookingOperation = "cancel_booking_api_v1_experts_me_bookings__booking_id__cancel_post";
type ExpertBookingsOperation = "expert_bookings_api_v1_experts_me_bookings_get";
type ExpertBookingOperation = "expert_booking_detail_api_v1_experts_me_bookings__booking_id__get";
type UpdateProfileOperation = "update_expert_profile_api_v1_experts_me_patch";
type ExpertSummaryOperation = "expert_summary_api_v1_experts_me_summary_get";
type ExpertServicesOperation = "expert_services_api_v1_experts_me_services_get";
type CreateServiceOperation = "create_expert_service_api_v1_experts_me_services_post";
type UpdateServiceOperation = "update_expert_service_api_v1_experts_me_services__service_id__patch";
type DeleteServiceOperation = "delete_expert_service_api_v1_experts_me_services__service_id__delete";

export type AvailabilityResponse = SuccessResponse<AvailabilityOperation>;
export type AvailabilityParams = QueryParams<AvailabilityOperation>;
export type AvailableSlot = AvailabilityResponse["slots"][number];
export type BookingCheckoutRequest = RequestBody<CreateBookingOperation>;
export type BookingCheckoutResponse = SuccessResponse<CreateBookingOperation>;
export type ConsultationBooking = SuccessResponse<BookingOperation>;
export type MyBookingsResponse = SuccessResponse<MyBookingsOperation>;
export type JoinResponse = SuccessResponse<JoinOperation>;
export type RecordingResponse = SuccessResponse<RecordingOperation>;
export type SessionAsset = SuccessResponse<SessionAssetsOperation>[number];
export type SessionAssetKind = SessionAsset["kind"];
export type SessionAssetLink = SuccessResponse<SessionAssetLinkOperation>;
export type ExpertProfileResponse = SuccessResponse<ExpertProfileOperation>;
export type ExpertSlotsParams = QueryParams<ExpertSlotsOperation>;
export type ExpertSlot = SuccessResponse<ExpertSlotsOperation>[number];
export type CreateSlotsRequest = RequestBody<CreateSlotsOperation>;
export type CreateSlotsResponse = SuccessResponse<CreateSlotsOperation>;
export type UpdateSlotRequest = RequestBody<UpdateSlotOperation>;
export type CancelBookingRequest = RequestBody<CancelBookingOperation>;
export type ExpertBookingsResponse = SuccessResponse<ExpertBookingsOperation>;
export type ExpertBookingsParams = QueryParams<ExpertBookingsOperation>;
export type ExpertBookingDetail = SuccessResponse<ExpertBookingOperation>;
export type UpdateExpertProfileRequest = RequestBody<UpdateProfileOperation>;
export type ExpertSummary = SuccessResponse<ExpertSummaryOperation>;
export type ExpertService = SuccessResponse<ExpertServicesOperation>[number];
export type CreateExpertServiceRequest = RequestBody<CreateServiceOperation>;
export type UpdateExpertServiceRequest = RequestBody<UpdateServiceOperation>;
export type DeleteExpertServiceResponse = SuccessResponse<DeleteServiceOperation>;
export type DecisionResponse = components["schemas"]["DecisionResponse"];

/** Shown to the customer before paying; the backend refuses any other version. */
export const CONSULTATION_TERMS_VERSION = "2026-10";

const consultationPaths = {
  availability: "/api/v1/consultations/products/{product_ref}/availability",
  bookings: "/api/v1/consultations/bookings",
  myBookings: "/api/v1/consultations/bookings/me",
  booking: "/api/v1/consultations/bookings/{booking_id}",
  join: "/api/v1/consultations/bookings/{booking_id}/join",
  recording: "/api/v1/consultations/bookings/{booking_id}/recording",
  sessionAssets: "/api/v1/consultations/bookings/{booking_id}/assets",
  sessionAsset: "/api/v1/consultations/bookings/{booking_id}/assets/{asset_id}",
  expert: "/api/v1/experts/me",
  expertSlots: "/api/v1/experts/me/slots",
  expertSlot: "/api/v1/experts/me/slots/{slot_id}",
  expertBookings: "/api/v1/experts/me/bookings",
  expertBooking: "/api/v1/experts/me/bookings/{booking_id}",
  expertSummary: "/api/v1/experts/me/summary",
  expertServices: "/api/v1/experts/me/services",
  expertService: "/api/v1/experts/me/services/{service_id}",
  approve: "/api/v1/experts/me/bookings/{booking_id}/approve",
  cancel: "/api/v1/experts/me/bookings/{booking_id}/cancel",
  reject: "/api/v1/experts/me/bookings/{booking_id}/reject",
} as const;

export const consultationKeys = {
  all: ["consultations"] as const,
  availability: (productRef: string) => [...consultationKeys.all, "availability", productRef] as const,
  myBookings: () => [...consultationKeys.all, "bookings", "me"] as const,
  booking: (id: string) => [...consultationKeys.all, "booking", id] as const,
  sessionAssets: (id: string) => [...consultationKeys.all, "booking", id, "assets"] as const,
  expert: () => [...consultationKeys.all, "expert"] as const,
  expertSlots: (params?: ExpertSlotsParams) => [...consultationKeys.all, "expert", "slots", params ?? {}] as const,
  expertBookings: (params?: ExpertBookingsParams) => [...consultationKeys.all, "expert", "bookings", params ?? {}] as const,
  expertBooking: (id: string) => [...consultationKeys.all, "expert", "booking", id] as const,
  expertSummary: () => [...consultationKeys.all, "expert", "summary"] as const,
  expertServices: () => [...consultationKeys.all, "expert", "services"] as const,
};

/** Free slots of a consultation. `productRef` is the product id or its slug (`consultation-<id>`). */
export function getAvailability(
  productRef: string,
  params?: AvailabilityParams,
  options?: AuthenticatedRequestOptions,
): Promise<AvailabilityResponse> {
  return customerRequest<AvailabilityResponse>("GET", consultationPaths.availability, {
    ...withAuthCookies(options),
    path: { product_ref: productRef },
    query: params,
  });
}

/** Holds the chosen slots and opens a Stripe session for them (one quantity per slot). */
export function createBookingCheckout(
  body: BookingCheckoutRequest,
  idempotencyKey: string,
  options?: AuthenticatedRequestOptions,
): Promise<BookingCheckoutResponse> {
  return customerRequest<BookingCheckoutResponse>("POST", consultationPaths.bookings, {
    ...withAuthCookies(options),
    headers: { "Idempotency-Key": idempotencyKey },
    body,
  });
}

export function listMyBookings(options?: AuthenticatedRequestOptions): Promise<MyBookingsResponse> {
  return customerRequest<MyBookingsResponse>("GET", consultationPaths.myBookings, withAuthCookies(options));
}

export function getBooking(bookingId: string, options?: AuthenticatedRequestOptions): Promise<ConsultationBooking> {
  return customerRequest<ConsultationBooking>("GET", consultationPaths.booking, {
    ...withAuthCookies(options),
    path: { booking_id: bookingId },
  });
}

/** A short-lived LiveKit token for this participant; refused before the room opens and after the hard stop. */
export function joinBooking(bookingId: string, options?: AuthenticatedRequestOptions): Promise<JoinResponse> {
  return customerRequest<JoinResponse>("POST", consultationPaths.join, {
    ...withAuthCookies(options),
    path: { booking_id: bookingId },
  });
}

export function getRecording(bookingId: string, options?: AuthenticatedRequestOptions): Promise<RecordingResponse> {
  return customerRequest<RecordingResponse>("GET", consultationPaths.recording, {
    ...withAuthCookies(options),
    path: { booking_id: bookingId },
  });
}

/** Whiteboard snapshots and board images saved during the session; both participants see them. */
export function listSessionAssets(bookingId: string, options?: AuthenticatedRequestOptions): Promise<SessionAsset[]> {
  return customerRequest<SessionAsset[]>("GET", consultationPaths.sessionAssets, {
    ...withAuthCookies(options),
    path: { booking_id: bookingId },
  });
}

export function getSessionAssetLink(
  bookingId: string,
  assetId: string,
  options?: AuthenticatedRequestOptions,
): Promise<SessionAssetLink> {
  return customerRequest<SessionAssetLink>("GET", consultationPaths.sessionAsset, {
    ...withAuthCookies(options),
    path: { booking_id: bookingId, asset_id: assetId },
  });
}

/** Session files the upload accepts (checked here first, then by the backend). */
export const SESSION_ASSET_TYPES: ReadonlySet<string> = new Set(["image/png", "image/jpeg", "image/webp"]);
export const SESSION_ASSET_MAX_BYTES = 10 * 1024 * 1024;

/** Same-origin URL of a session file: streamed by this app, so it never expires inside the board. */
export function sessionAssetSrc(bookingId: string, assetId: string): string {
  return `/api/consultations/${encodeURIComponent(bookingId)}/assets/${encodeURIComponent(assetId)}`;
}

/**
 * Saves an image to the session's files (only while the room is open). The bytes go through this
 * app to S3, so it doesn't depend on the bucket's CORS; an expired session is renewed once.
 */
export async function uploadSessionAsset(
  bookingId: string,
  file: Blob,
  kind: SessionAssetKind,
  signal?: AbortSignal,
): Promise<{ asset_id: string; src: string }> {
  const send = () => {
    const form = new FormData();
    form.set("file", file);
    form.set("kind", kind);
    return fetch(`/api/consultations/${encodeURIComponent(bookingId)}/assets`, { method: "POST", body: form, signal });
  };
  let response = await send();
  if (response.status === 401 && (await refreshOnce())) response = await send();
  if (!response.ok) throw new Error(`Session file upload failed (${response.status})`);
  return (await response.json()) as { asset_id: string; src: string };
}

/** The signed-in customer's consultant record; 403 when they are not an expert. */
export function getExpertProfile(options?: AuthenticatedRequestOptions): Promise<ExpertProfileResponse> {
  return customerRequest<ExpertProfileResponse>("GET", consultationPaths.expert, withAuthCookies(options));
}

export function listExpertSlots(params?: ExpertSlotsParams, options?: AuthenticatedRequestOptions): Promise<ExpertSlot[]> {
  return customerRequest<ExpertSlot[]>("GET", consultationPaths.expertSlots, {
    ...withAuthCookies(options),
    query: params,
  });
}

export function createExpertSlots(
  body: CreateSlotsRequest,
  options?: AuthenticatedRequestOptions,
): Promise<CreateSlotsResponse> {
  return customerRequest<CreateSlotsResponse>("POST", consultationPaths.expertSlots, {
    ...withAuthCookies(options),
    body,
  });
}

/** Moves a free slot; 409 when a customer holds it or the new time overlaps another slot. */
export function updateExpertSlot(
  slotId: string,
  body: UpdateSlotRequest,
  options?: AuthenticatedRequestOptions,
): Promise<void> {
  return customerRequest<void>("PATCH", consultationPaths.expertSlot, {
    ...withAuthCookies(options),
    path: { slot_id: slotId },
    body,
  });
}

/** Deletes a free slot; 409 when a customer is paying for it or a paid booking owns it. */
export function deleteExpertSlot(slotId: string, options?: AuthenticatedRequestOptions): Promise<void> {
  return customerRequest<void>("DELETE", consultationPaths.expertSlot, {
    ...withAuthCookies(options),
    path: { slot_id: slotId },
  });
}

/** The expert's paid bookings, newest first, one page at a time. */
export function listExpertBookings(
  params?: ExpertBookingsParams,
  options?: AuthenticatedRequestOptions,
): Promise<ExpertBookingsResponse> {
  return customerRequest<ExpertBookingsResponse>("GET", consultationPaths.expertBookings, {
    ...withAuthCookies(options),
    query: params,
  });
}

/** One booking with the customer's contact details and its event timeline. */
export function getExpertBooking(bookingId: string, options?: AuthenticatedRequestOptions): Promise<ExpertBookingDetail> {
  return customerRequest<ExpertBookingDetail>("GET", consultationPaths.expertBooking, {
    ...withAuthCookies(options),
    path: { booking_id: bookingId },
  });
}

/** 409 when the session length changes while upcoming slots or active bookings exist. */
export function updateExpertProfile(
  body: UpdateExpertProfileRequest,
  options?: AuthenticatedRequestOptions,
): Promise<ExpertProfileResponse> {
  return customerRequest<ExpertProfileResponse>("PATCH", consultationPaths.expert, { ...withAuthCookies(options), body });
}

export function getExpertSummary(options?: AuthenticatedRequestOptions): Promise<ExpertSummary> {
  return customerRequest<ExpertSummary>("GET", consultationPaths.expertSummary, withAuthCookies(options));
}

export function listExpertServices(options?: AuthenticatedRequestOptions): Promise<ExpertService[]> {
  return customerRequest<ExpertService[]>("GET", consultationPaths.expertServices, withAuthCookies(options));
}

export function createExpertService(
  body: CreateExpertServiceRequest,
  options?: AuthenticatedRequestOptions,
): Promise<ExpertService> {
  return customerRequest<ExpertService>("POST", consultationPaths.expertServices, { ...withAuthCookies(options), body });
}

/** Only the fields sent change; a new price applies to new bookings only. */
export function updateExpertService(
  serviceId: string,
  body: UpdateExpertServiceRequest,
  options?: AuthenticatedRequestOptions,
): Promise<ExpertService> {
  return customerRequest<ExpertService>("PATCH", consultationPaths.expertService, {
    ...withAuthCookies(options),
    path: { service_id: serviceId },
    body,
  });
}

/** Deleted when nothing references it, otherwise archived (`outcome` says which). */
export function deleteExpertService(
  serviceId: string,
  options?: AuthenticatedRequestOptions,
): Promise<DeleteExpertServiceResponse> {
  return customerRequest<DeleteExpertServiceResponse>("DELETE", consultationPaths.expertService, {
    ...withAuthCookies(options),
    path: { service_id: serviceId },
  });
}

export function approveBooking(bookingId: string, options?: AuthenticatedRequestOptions): Promise<DecisionResponse> {
  return customerRequest<DecisionResponse>("POST", consultationPaths.approve, {
    ...withAuthCookies(options),
    path: { booking_id: bookingId },
  });
}

export function rejectBooking(
  bookingId: string,
  reason: string | null,
  options?: AuthenticatedRequestOptions,
): Promise<DecisionResponse> {
  return customerRequest<DecisionResponse>("POST", consultationPaths.reject, {
    ...withAuthCookies(options),
    path: { booking_id: bookingId },
    body: { reason },
  });
}

/**
 * The expert withdraws a paid booking before it starts: the customer is emailed and refunded, and
 * the booking's slots are released for others or removed from the calendar.
 */
export function cancelExpertBooking(
  bookingId: string,
  body: CancelBookingRequest,
  options?: AuthenticatedRequestOptions,
): Promise<DecisionResponse> {
  return customerRequest<DecisionResponse>("POST", consultationPaths.cancel, {
    ...withAuthCookies(options),
    path: { booking_id: bookingId },
    body,
  });
}

export const consultationQueries = {
  myBookings: (context?: ApiRequestContext) =>
    queryOptions({
      queryKey: consultationKeys.myBookings(),
      queryFn: ({ signal }) => listMyBookings({ signal, context }),
      staleTime: 15_000,
    }),
  booking: (id: string, context?: ApiRequestContext) =>
    queryOptions({
      queryKey: consultationKeys.booking(id),
      queryFn: ({ signal }) => getBooking(id, { signal, context }),
      staleTime: 10_000,
    }),
  sessionAssets: (id: string, context?: ApiRequestContext) =>
    queryOptions({
      queryKey: consultationKeys.sessionAssets(id),
      queryFn: ({ signal }) => listSessionAssets(id, { signal, context }),
      staleTime: 30_000,
    }),
  expert: (context?: ApiRequestContext) =>
    queryOptions({
      queryKey: consultationKeys.expert(),
      queryFn: ({ signal }) => getExpertProfile({ signal, context }),
      staleTime: 5 * 60_000,
      // 403 means "not an expert": an answer, not a failure to retry.
      retry: false,
    }),
  expertSlots: (params?: ExpertSlotsParams, context?: ApiRequestContext) =>
    queryOptions({
      queryKey: consultationKeys.expertSlots(params),
      queryFn: ({ signal }) => listExpertSlots(params, { signal, context }),
      staleTime: 15_000,
    }),
  expertBookings: (params?: ExpertBookingsParams, context?: ApiRequestContext) =>
    queryOptions({
      queryKey: consultationKeys.expertBookings(params),
      queryFn: ({ signal }) => listExpertBookings(params, { signal, context }),
      staleTime: 10_000,
    }),
  expertBooking: (id: string, context?: ApiRequestContext) =>
    queryOptions({
      queryKey: consultationKeys.expertBooking(id),
      queryFn: ({ signal }) => getExpertBooking(id, { signal, context }),
      staleTime: 10_000,
    }),
  expertSummary: (context?: ApiRequestContext) =>
    queryOptions({
      queryKey: consultationKeys.expertSummary(),
      queryFn: ({ signal }) => getExpertSummary({ signal, context }),
      staleTime: 15_000,
    }),
  expertServices: (context?: ApiRequestContext) =>
    queryOptions({
      queryKey: consultationKeys.expertServices(),
      queryFn: ({ signal }) => listExpertServices({ signal, context }),
      staleTime: 30_000,
    }),
};
