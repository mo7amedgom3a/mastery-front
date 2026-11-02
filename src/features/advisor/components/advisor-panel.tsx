"use client";

import { clsx as cn } from "clsx";
import { Maximize2, Minimize2, RotateCcw, Send, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

import { BidiText, textDir } from "@/components/content/bidi";
import { apiFetch } from "@/lib/api/client";

import { advisorCopy } from "../content/copy";
import { ADVISOR_LAUNCHER_ID, ADVISOR_PANEL_ID } from "../model/ids";
import { useAdvisorStore } from "../model/store";
import type { AdvisorSuggestion } from "../model/types";
import { AdvisorAgent } from "./advisor-agent";
import { AdvisorLoginDialog } from "./advisor-login-dialog";
import { AdvisorMessage } from "./advisor-message";

const MAX_QUESTION_CHARS = 1000;

/** The chat: greeting, suggested questions, the conversation and the composer. */
export function AdvisorPanel() {
  const expanded = useAdvisorStore((state) => state.expanded);
  const messages = useAdvisorStore((state) => state.messages);
  const busy = useAdvisorStore((state) => state.busy);
  const mood = useAdvisorStore((state) => state.mood);
  const suggestions = useAdvisorStore((state) => state.suggestions);
  const pendingQuestion = useAdvisorStore((state) => state.pendingQuestion);
  const loginOpen = useAdvisorStore((state) => state.loginOpen);
  const { setOpen, toggleExpanded, setSuggestions, ask, startNewChat, openLogin } = useAdvisorStore.getState();
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (suggestions.length) return;
    const controller = new AbortController();
    apiFetch<{ items: AdvisorSuggestion[] }>("/api/v1/advisor/suggestions", {
      sameOrigin: true,
      query: { locale: "ar" },
      signal: controller.signal,
    })
      .then((data) => setSuggestions(data.items ?? []))
      .catch(() => undefined);
    return () => controller.abort();
  }, [suggestions.length, setSuggestions]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Follow the answer as it streams in.
  const lastText = messages.at(-1)?.role === "assistant" ? messages.at(-1)?.text : undefined;
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages.length, lastText]);

  const close = () => {
    setOpen(false);
    document.getElementById(ADVISOR_LAUNCHER_ID)?.focus();
  };

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    const question = draft.trim();
    if (!question || busy) return;
    setDraft("");
    void ask(question);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <section
      id={ADVISOR_PANEL_ID}
      role="dialog"
      aria-modal="false"
      aria-labelledby="ma-advisor-title"
      className={cn("ma-advisor-panel", expanded && "is-expanded")}
      onKeyDown={(event) => {
        // The login dialog handles its own Escape.
        if (event.key === "Escape" && !loginOpen) close();
      }}
    >
      <header className="flex items-center gap-3 border-b border-line px-4 py-3">
        <AdvisorAgent mood={mood} className="size-12 shrink-0" />
        <div className="min-w-0 flex-1">
          <h2 id="ma-advisor-title" className="m-0 truncate text-base leading-7 font-bold">
            {advisorCopy.name}
          </h2>
          <p className="m-0 truncate text-xs leading-5 text-fg-muted" aria-live="polite">
            {busy ? advisorCopy.thinking : " "}
          </p>
        </div>
        <button type="button" onClick={startNewChat} aria-label={advisorCopy.newChat} title={advisorCopy.newChat} className="ma-btn ma-btn--bare ma-btn--icon size-11 shrink-0">
          <RotateCcw aria-hidden="true" className="size-5 fill-none" />
        </button>
        <button
          type="button"
          onClick={toggleExpanded}
          aria-label={expanded ? advisorCopy.shrink : advisorCopy.expand}
          title={expanded ? advisorCopy.shrink : advisorCopy.expand}
          className="ma-btn ma-btn--bare ma-btn--icon size-11 shrink-0 max-sm:hidden"
        >
          {expanded ? <Minimize2 aria-hidden="true" className="size-5 fill-none" /> : <Maximize2 aria-hidden="true" className="size-5 fill-none" />}
        </button>
        <button type="button" onClick={close} aria-label={advisorCopy.close} title={advisorCopy.close} className="ma-btn ma-btn--bare ma-btn--icon size-11 shrink-0">
          <X aria-hidden="true" className="size-5 fill-none" />
        </button>
      </header>

      <div ref={listRef} className="flex flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4" aria-live="polite">
        <AdvisorMessage message={{ id: "greeting", role: "assistant", text: advisorCopy.greeting, status: "done", question: "" }} expanded={expanded} />

        {messages.length === 0 && suggestions.length > 0 ? (
          <div className="flex flex-col gap-2 ps-11">
            <p className="m-0 text-sm font-medium text-fg-muted">{advisorCopy.suggestionsTitle}</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((item) => (
                <button
                  key={item.question}
                  type="button"
                  onClick={() => void ask(item.question, { suggested: true })}
                  disabled={busy}
                  className="ma-btn ma-btn--soft ma-btn--sm h-auto min-h-11 py-2 text-start leading-6 whitespace-normal"
                >
                  <BidiText text={item.question} />
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((message) => (
          <AdvisorMessage key={message.id} message={message} expanded={expanded} />
        ))}

        {pendingQuestion && !loginOpen ? (
          <div className="flex flex-col gap-2 self-end rounded-panel border border-line p-3 text-sm">
            <p className="m-0 leading-6 text-fg-muted">
              «<BidiText text={pendingQuestion} />»
            </p>
            <button type="button" onClick={openLogin} className="ma-btn ma-btn--soft ma-btn--sm min-h-11">
              {advisorCopy.loginPending}
            </button>
          </div>
        ) : null}
      </div>

      <form onSubmit={submit} className="flex items-end gap-2 border-t border-line p-3">
        <label htmlFor="ma-advisor-input" className="sr-only">
          {advisorCopy.placeholder}
        </label>
        <textarea
          id="ma-advisor-input"
          ref={inputRef}
          rows={1}
          dir={draft.trim() ? textDir(draft) : "rtl"}
          value={draft}
          maxLength={MAX_QUESTION_CHARS}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={advisorCopy.placeholder}
          className="ma-input max-h-36 min-h-11 flex-1 resize-none py-2 leading-7 [field-sizing:content]"
        />
        <button type="submit" disabled={busy || !draft.trim()} aria-label={advisorCopy.send} className="ma-btn ma-btn--primary ma-btn--icon size-11 shrink-0">
          <Send aria-hidden="true" className="size-5 fill-none rtl:-scale-x-100" />
        </button>
      </form>

      <AdvisorLoginDialog />
    </section>
  );
}
