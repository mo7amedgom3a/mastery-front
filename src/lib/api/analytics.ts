import { apiRequest, type ApiRequestContext, type ApiRequestOptions } from "@/lib/api/client";
import { getCustomerTrackingContext } from "@/lib/customer-tracking";

export type BehaviorEventRequest = {
  event_type: string;
  entity_type: string;
  legacy_entity_id?: number | null;
  product_id?: string | null;
  metadata?: Record<string, unknown>;
};

export type BehaviorEventResponse = {
  recorded: boolean;
  request_id: string | null;
};

type TrackBehaviorEventOptions = Omit<ApiRequestOptions, "body" | "context"> & {
  context?: ApiRequestContext;
};

export function trackBehaviorEvent(
  event: BehaviorEventRequest,
  options: TrackBehaviorEventOptions = {},
): Promise<BehaviorEventResponse> {
  const { context, ...requestOptions } = options;

  return apiRequest<BehaviorEventResponse>("POST", "/api/v1/analytics/events", {
    ...requestOptions,
    body: event,
    credentials: "include",
    context: context ?? getCustomerTrackingContext(),
  });
}
