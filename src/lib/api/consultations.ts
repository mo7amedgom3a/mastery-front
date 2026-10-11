import { queryOptions } from "@tanstack/react-query";

import type { ApiRequestContext } from "@/lib/api/client";
import { customerRequest, withAuthCookies, type AuthenticatedRequestOptions } from "@/lib/api/customers";
import type { QueryParams, RequestBody, SuccessResponse } from "@/lib/api/operation-types";
import type { components } from "@/types/openapi";

type AvailabilityOperation = "consultation_availability_api_v1_consultations_products__product_ref__availability_get";
type CreateBookingOperation = "create_booking_checkout_api_v1_consultations_bookings_post";
type MyBookingsOperation = "my_bookings_api_v1_consultations_bookings_me_get";
type BookingOperation = "booking_detail_api_v1_consultations_bookings__booking_id__get";
type JoinOperation = "join_booking_api_v1_consultations_bookings__booking_id__join_post";
type RecordingOperation = "booking_recording_api_v1_consultations_bookings__booking_id__recording_get";
type ExpertProfileOperation = "expert_profile_api_v1_experts_me_get";
type ExpertSlotsOperation = "expert_slots_api_v1_experts_me_slots_get";
type CreateSlotsOperation = "create_expert_slots_api_v1_experts_me_slots_post";
type ExpertBookingsOperation = "expert_bookings_api_v1_experts_me_bookings_get";

export type AvailabilityResponse = SuccessResponse<AvailabilityOperation>;
export type AvailabilityParams = QueryParams<AvailabilityOperation>;
export type AvailableSlot = AvailabilityResponse["slots"][number];
export type BookingCheckoutRequest = RequestBody<CreateBookingOperation>;
export type BookingCheckoutResponse = SuccessResponse<CreateBookingOperation>;
export type ConsultationBooking = SuccessResponse<BookingOperation>;
export type MyBookingsResponse = SuccessResponse<MyBookingsOperation>;
export type JoinResponse = SuccessResponse<JoinOperation>;
export type RecordingResponse = SuccessResponse<RecordingOperation>;
export type ExpertProfileResponse = SuccessResponse<ExpertProfileOperation>;
export type ExpertSlotsParams = QueryParams<ExpertSlotsOperation>;
export type ExpertSlot = SuccessResponse<ExpertSlotsOperation>[number];
export type CreateSlotsRequest = RequestBody<CreateSlotsOperation>;
export type CreateSlotsResponse = SuccessResponse<CreateSlotsOperation>;
export type ExpertBookingsResponse = SuccessResponse<ExpertBookingsOperation>;
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
  expert: "/api/v1/experts/me",
  expertSlots: "/api/v1/experts/me/slots",
  expertSlot: "/api/v1/experts/me/slots/{slot_id}",
  expertBookings: "/api/v1/experts/me/bookings",
  approve: "/api/v1/experts/me/bookings/{booking_id}/approve",
  reject: "/api/v1/experts/me/bookings/{booking_id}/reject",
} as const;

export const consultationKeys = {
  all: ["consultations"] as const,
  availability: (productRef: string) => [...consultationKeys.all, "availability", productRef] as const,
  myBookings: () => [...consultationKeys.all, "bookings", "me"] as const,
  booking: (id: string) => [...consultationKeys.all, "booking", id] as const,
  expert: () => [...consultationKeys.all, "expert"] as const,
  expertSlots: (params?: ExpertSlotsParams) => [...consultationKeys.all, "expert", "slots", params ?? {}] as const,
  expertBookings: () => [...consultationKeys.all, "expert", "bookings"] as const,
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

export function deleteExpertSlot(slotId: string, options?: AuthenticatedRequestOptions): Promise<void> {
  return customerRequest<void>("DELETE", consultationPaths.expertSlot, {
    ...withAuthCookies(options),
    path: { slot_id: slotId },
  });
}

export function listExpertBookings(options?: AuthenticatedRequestOptions): Promise<ExpertBookingsResponse> {
  return customerRequest<ExpertBookingsResponse>("GET", consultationPaths.expertBookings, withAuthCookies(options));
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
  expertBookings: (context?: ApiRequestContext) =>
    queryOptions({
      queryKey: consultationKeys.expertBookings(),
      queryFn: ({ signal }) => listExpertBookings({ signal, context }),
      staleTime: 10_000,
    }),
};
