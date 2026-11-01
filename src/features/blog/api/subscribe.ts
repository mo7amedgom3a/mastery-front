import { apiRequest } from "@/lib/api/client";

export type BlogSubscribeResponse = { ok: boolean; already_subscribed: boolean };
export type BlogUnsubscribeResponse = { ok: boolean; unsubscribed: boolean };

/**
 * Newsletter sign-up from the article/list page. The browser calls the backend through this app's
 * same-origin door (`/api/b2c/blog/subscribe`), which is where the API base URL is configured.
 */
export function subscribeToBlog(email: string, source = "blog"): Promise<BlogSubscribeResponse> {
  return apiRequest<BlogSubscribeResponse>("POST", "/api/v1/blog/subscribe", {
    body: { email: email.trim(), source },
    sameOrigin: true,
  });
}

/** The one-click unsubscribe link in every newsletter email (`/blog/unsubscribe?token=…`). */
export function unsubscribeFromBlog(token: string): Promise<BlogUnsubscribeResponse> {
  return apiRequest<BlogUnsubscribeResponse>("POST", "/api/v1/blog/unsubscribe", {
    body: { token },
    sameOrigin: true,
  });
}
