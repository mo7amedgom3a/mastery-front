"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

import { BidiText } from "@/components/content/bidi";
import { LoginForm } from "@/features/auth/components/login-form";
import { trackAuth } from "@/lib/observability/behavior";

import { advisorCopy } from "../content/copy";
import { useAdvisorStore } from "../model/store";

/**
 * Asked when a guest types their own question: sign-in happens right here, and the question is then
 * answered in a new conversation. The suggested questions need no sign-in.
 */
export function AdvisorLoginDialog() {
  const open = useAdvisorStore((state) => state.loginOpen);
  const pendingQuestion = useAdvisorStore((state) => state.pendingQuestion);
  const close = useAdvisorStore((state) => state.closeLogin);
  const resumePending = useAdvisorStore((state) => state.resumePending);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      trackAuth("auth_gate_opened", { surface: "ai_advisor" });
    } else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={close}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      aria-labelledby="ma-advisor-login-title"
      className="m-auto max-h-[calc(100svh-1rem)] w-[min(28rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] overflow-y-auto rounded-panel border border-line-strong bg-surface p-0 text-fg backdrop:bg-ink/70"
    >
      {open ? (
        <div className="flex flex-col gap-5 p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <h2 id="ma-advisor-login-title" className="m-0 text-xl leading-8 font-bold">
              {advisorCopy.loginTitle}
            </h2>
            <button type="button" onClick={close} aria-label={advisorCopy.close} className="ma-btn ma-btn--bare ma-btn--icon size-11 shrink-0">
              <X aria-hidden="true" className="size-5 fill-none" />
            </button>
          </div>
          <p className="m-0 leading-7 text-fg-muted">{advisorCopy.loginBody}</p>
          {pendingQuestion ? (
            <p className="m-0 rounded-photo bg-(--fill-soft) px-3.5 py-2.5 text-sm leading-7">
              «<BidiText text={pendingQuestion} />»
            </p>
          ) : null}
          <LoginForm next="/" onSignedIn={resumePending} />
        </div>
      ) : null}
    </dialog>
  );
}
