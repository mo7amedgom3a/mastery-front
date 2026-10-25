"use client";

import { useEffect } from "react";

import { apiRequest } from "@/lib/api/client";

import { answersOf, useRequestStore, type RequestAnswers } from "./request-store";
import { draftLeadSchema } from "./schema";
import type { RequestStepId } from "./steps";

let pendingSave: Promise<unknown> = Promise.resolve();

function draftToken(): string {
  const state = useRequestStore.getState();
  if (state.draftToken) return state.draftToken;
  const token = `${crypto.randomUUID().replaceAll("-", "")}${crypto.randomUUID().replaceAll("-", "")}`;
  state.setDraftToken(token);
  return token;
}

/** Saves the latest answers in order, so a late response cannot move the recorded step backwards. */
export function saveCompanyDraftForStep(step: RequestStepId, answers: RequestAnswers): Promise<void> {
  if (!draftLeadSchema.safeParse(answers).success) return Promise.resolve();
  const token = draftToken();
  const save = pendingSave.catch(() => undefined).then(async () => {
    useRequestStore.getState().setDraftSaveStatus("saving");
    try {
      await apiRequest("PUT", "/api/v1/requests/company-training/draft",
        { sameOrigin: true, body: { draftToken: token, step, answers }, cache: "no-store", keepalive: true });
      useRequestStore.getState().setDraftSaveStatus("saved");
    } catch (error) {
      useRequestStore.getState().setDraftSaveStatus("error");
      throw error;
    }
  });
  pendingSave = save;
  return save.then(() => undefined);
}

/** Saves valid contact details and the current step, including when someone leaves mid-step. */
export function DraftProgressSync({ step }: { step: RequestStepId }) {
  useEffect(() => {
    let lastSnapshot = "";
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = (immediate = false) => {
      const answers = answersOf(useRequestStore.getState());
      if (!draftLeadSchema.safeParse(answers).success) return;
      const snapshot = JSON.stringify([step, answers]);
      if (snapshot === lastSnapshot && !immediate) return;
      lastSnapshot = snapshot;
      clearTimeout(timer);
      const send = () => {
        void saveCompanyDraftForStep(step, answers).catch((error) => {
          console.error("[company-request] Draft progress could not be saved", error);
          lastSnapshot = "";
        });
      };
      if (immediate) send();
      else timer = setTimeout(send, 3000);
    };
    schedule();
    const unsubscribe = useRequestStore.subscribe(() => schedule());
    const onLeave = () => { if (document.visibilityState === "hidden") schedule(true); };
    document.addEventListener("visibilitychange", onLeave);
    return () => {
      clearTimeout(timer);
      unsubscribe();
      document.removeEventListener("visibilitychange", onLeave);
    };
  }, [step]);

  return null;
}
