"use client";

import { useCallback, useRef, useState } from "react";

import type { LabAction, LabCompletionRequest, LabSession } from "../contract";
import { labErrorMessage } from "../errors";
import { abandonLabSession, completeLabSession, sendLabAction, startLabSession } from "../services/sessions";
import type { LabResult } from "../../model/types";
import { useLabRunTarget } from "./lab-run-context";

type CompleteFallback = () => LabResult;

export type LabSessionOptions = {
  preview?: boolean;
  source?: string;
  assignment_id?: string;
};

/**
 * One lab run against the labs API.
 *
 * The bespoke lab components still own their local engine state; this hook records the meaningful
 * actions in order, starts/resumes the server session, and completes it. Completion falls back to
 * the existing local scorer if the mock/API is unavailable, so a learner never loses a debrief.
 */
export function useLabSession(runnerSlug: string, options: LabSessionOptions = {}) {
  // In live mode a bespoke runner may play a scenario of another API lab (see LabRunProvider).
  const target = useLabRunTarget();
  const slug = target?.apiSlug ?? runnerSlug;
  const scenarioKey = target?.scenarioKey;
  const previewToken = target?.previewToken;
  const [session, setSession] = useState<LabSession | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<LabSession | null>(null);
  const startRef = useRef<Promise<LabSession> | null>(null);
  const queueRef = useRef<Promise<void>>(Promise.resolve());

  const ensure = useCallback(async (): Promise<LabSession> => {
    if (sessionRef.current) return sessionRef.current;
    startRef.current ??= startLabSession(slug, {
      preview: options.preview,
      source: options.source,
      assignment_id: options.assignment_id,
      scenario_key: scenarioKey,
      preview_token: previewToken,
    }).then((started) => {
      sessionRef.current = started;
      setSession(started);
      return started;
    });
    return startRef.current;
  }, [slug, scenarioKey, previewToken, options.preview, options.source, options.assignment_id]);

  const start = useCallback(async (): Promise<LabSession> => {
    setError(null);
    try {
      return await ensure();
    } catch (cause) {
      setError(labErrorMessage(cause));
      throw cause;
    }
  }, [ensure]);

  const send = useCallback(
    (action: LabAction): Promise<void> => {
      const run = async () => {
        try {
          const current = await ensure();
          const seq = current.state.seq;
          const result = await sendLabAction(current.session_id, {
            client_action_id: `${current.session_id}-${seq}-${action.type}`,
            seq,
            action,
          });
          sessionRef.current = result.session;
          setSession(result.session);
        } catch (cause) {
          setError(labErrorMessage(cause));
        }
      };
      queueRef.current = queueRef.current.then(run, run);
      return queueRef.current;
    },
    [ensure],
  );

  const complete = useCallback(
    async (payload: LabCompletionRequest, fallback: CompleteFallback): Promise<LabResult> => {
      setPending(true);
      setError(null);
      try {
        await queueRef.current;
        const current = await ensure();
        const result = await completeLabSession(current.session_id, payload);
        sessionRef.current = { ...current, status: "completed" };
        setSession(sessionRef.current);
        return {
          scorecard: result.scorecard,
          xp: result.attempt?.xp ?? result.xp ?? 0,
          newBadges: result.new_badges,
          pre: result.attempt?.pre ?? payload.pre,
          post: result.attempt?.post ?? payload.post,
        };
      } catch (cause) {
        // Degraded mode: the local scorer is the same rubric; the attempt will not reach the mock DB.
        setError(labErrorMessage(cause));
        return fallback();
      } finally {
        setPending(false);
      }
    },
    [ensure],
  );

  const reset = useCallback(async (): Promise<void> => {
    const current = sessionRef.current;
    sessionRef.current = null;
    startRef.current = null;
    setSession(null);
    setError(null);
    if (current && current.status === "in_progress") {
      await abandonLabSession(current.session_id).catch(() => undefined);
    }
  }, []);

  return {
    session,
    pending,
    error,
    start,
    send,
    complete,
    reset,
    enterPhase: (phaseId: string) => send({ type: "phase.enter", phase_id: phaseId }),
    submitQuiz: (phase: "pre" | "post", answers: number[]) => send({ type: "quiz.submit", phase, answers }),
    choose: (graphId: string, nodeId: string, choiceId: string) =>
      send({ type: "dialogue.choose", graph_id: graphId, node_id: nodeId, choice_id: choiceId }),
    submitForm: (phaseId: string, values: Record<string, unknown>) =>
      send({ type: "form.submit", phase_id: phaseId, values }),
    simulateStep: (phaseId: string, decision: Record<string, unknown>) =>
      send({ type: "simulator.step", phase_id: phaseId, decision }),
    redline: (phaseId: string, clauseId: string, optionId: string) =>
      send({ type: "document.redline", phase_id: phaseId, clause_id: clauseId, option_id: optionId }),
    updateCrm: (phaseId: string, entry: Record<string, unknown>) => send({ type: "crm.update", phase_id: phaseId, entry }),
    setCommitment: (phaseId: string, value: string) => send({ type: "commitment.set", phase_id: phaseId, value }),
  };
}

export type LabSessionHandle = ReturnType<typeof useLabSession>;
