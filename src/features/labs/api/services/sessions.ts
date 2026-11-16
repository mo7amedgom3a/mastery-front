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
};

export async function startLabSession(slug: string, input: StartSessionInput = {}): Promise<LabSession> {
  const transport = await getLabTransport();
  return transport.request<LabSession>("POST", labPaths.startSession(slug), {
    body: { source: "lab-page", ...input },
  });
}

export async function getLabSession(sessionId: string): Promise<LabSession> {
  const transport = await getLabTransport();
  return transport.request<LabSession>("GET", labPaths.session(sessionId));
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

export async function abandonLabSession(sessionId: string): Promise<{ ok: true; session: LabSession }> {
  const transport = await getLabTransport();
  return transport.request<{ ok: true; session: LabSession }>("POST", labPaths.abandon(sessionId));
}
