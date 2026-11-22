import { getLabTransport } from "../client";
import type {
  LabActionRequest,
  LabActionResult,
  LabCompletionRequest,
  LabCompletionResult,
  LabSession,
} from "../contract";
import { labPaths } from "../endpoints";

export type StartSessionInput = {
  preview?: boolean;
  source?: string;
  assignment_id?: string;
  /** Live API: which scenario of the lab to run (the server may override it for assignments). */
  scenario_key?: string;
  /** Live API: admin preview token (runs the draft; nothing is stored). */
  preview_token?: string;
};

/** The mock returns the session; the live API returns `{ session, scenario }`. */
function unwrapSession(data: LabSession | { session: LabSession }): LabSession {
  return "session" in data ? data.session : data;
}

export async function startLabSession(slug: string, input: StartSessionInput = {}): Promise<LabSession> {
  const transport = await getLabTransport();
  const body = transport.mode === "live" ? { source: "lab-page", ...input, preview: undefined } : { source: "lab-page", ...input };
  const data = await transport.request<LabSession | { session: LabSession }>("POST", labPaths.startSession(slug), { body });
  return unwrapSession(data);
}

export async function getLabSession(sessionId: string): Promise<LabSession> {
  const transport = await getLabTransport();
  return unwrapSession(await transport.request<LabSession | { session: LabSession }>("GET", labPaths.session(sessionId)));
}

export async function sendLabAction(sessionId: string, request: LabActionRequest): Promise<LabActionResult> {
  const transport = await getLabTransport();
  return transport.request<LabActionResult>("POST", labPaths.actions(sessionId), { body: request });
}

export async function completeLabSession(
  sessionId: string,
  request: LabCompletionRequest,
): Promise<LabCompletionResult> {
  const transport = await getLabTransport();
  return transport.request<LabCompletionResult>("POST", labPaths.complete(sessionId), { body: request });
}

export async function abandonLabSession(sessionId: string): Promise<LabSession> {
  const transport = await getLabTransport();
  const data = await transport.request<LabSession | { ok: true; session: LabSession }>("POST", labPaths.abandon(sessionId));
  return unwrapSession(data);
}
