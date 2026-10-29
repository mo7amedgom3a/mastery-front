import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/lib/auth/store";

import { streamAdvisor } from "./stream";
import type { AdvisorAnswer, AdvisorSuggestion, AgentMood, ChatMessage } from "./types";

const EXPANDED_KEY = "ma-advisor-expanded";
/** How long the face smiles after an answer lands. */
const JOY_MS = 1600;

type AdvisorState = {
  open: boolean;
  expanded: boolean;
  messages: ChatMessage[];
  /** The backend conversation the next question continues; null starts a new one. */
  conversationId: string | null;
  busy: boolean;
  mood: AgentMood;
  /** A guest's own question, held until they sign in. */
  pendingQuestion: string | null;
  loginOpen: boolean;
  /** The suggested questions; a guest may ask these (they are answered from cache). Not persisted. */
  suggestions: AdvisorSuggestion[];

  setOpen: (open: boolean) => void;
  toggleExpanded: () => void;
  setSuggestions: (suggestions: AdvisorSuggestion[]) => void;
  /** `suggested`: picked from the suggestions list, so a guest may ask it without signing in. */
  ask: (question: string, options?: { suggested?: boolean }) => Promise<void>;
  /** Asks the held question again, in a new conversation; called once the guest has signed in. */
  resumePending: () => void;
  closeLogin: () => void;
  openLogin: () => void;
  startNewChat: () => void;
};

let controller: AbortController | null = null;
let joyTimer: ReturnType<typeof setTimeout> | undefined;

const messageId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Math.random()).slice(2));

function readExpanded(): boolean {
  try {
    return localStorage.getItem(EXPANDED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeExpanded(expanded: boolean): void {
  try {
    localStorage.setItem(EXPANDED_KEY, expanded ? "1" : "0");
  } catch {
    // Private mode: the size simply isn't remembered.
  }
}

/** Questions about the catalog that came back without a single product, or no usable answer at all. */
const CATALOG_INTENTS = new Set(["course_search", "product_details", "study_plan", "career_advice", "off_topic"]);

function needsCatalogGuide(answer: AdvisorAnswer): boolean {
  if (answer.clarification_needed) return false;
  if (!answer.answer.trim() || answer.source === "degraded") return true;
  return answer.products.length === 0 && CATALOG_INTENTS.has(answer.intent);
}

/** Below the kit's 600px breakpoint the panel covers the page: following a link closes it. */
export function closeAdvisorOnSmallScreen(): void {
  if (typeof window !== "undefined" && window.matchMedia("(max-width: 599px)").matches) {
    useAdvisorStore.getState().setOpen(false);
  }
}

const sameQuestion = (a: string, b: string) => a.trim().replace(/\s+/g, " ") === b.trim().replace(/\s+/g, " ");

/** Signed in, for the gate. A check still in flight is waited for, so a signed-in visitor is never asked to sign in. */
async function isSignedIn(): Promise<boolean> {
  const auth = useAuthStore.getState();
  if (auth.status === "idle" || auth.status === "loading") {
    try {
      return Boolean(await auth.bootstrap());
    } catch {
      return false;
    }
  }
  return auth.status === "authenticated";
}

export const useAdvisorStore = create<AdvisorState>()(
  persist(
    (set, get) => {
      /** Updates the assistant message `id` in place. */
      const patch = (id: string, update: Partial<Extract<ChatMessage, { role: "assistant" }>>) =>
        set((state) => ({
          messages: state.messages.map((message) => (message.id === id && message.role === "assistant" ? { ...message, ...update } : message)),
        }));

      const finish = (id: string, answer: AdvisorAnswer) => {
        patch(id, {
          text: answer.answer,
          status: "done",
          products: answer.products,
          followUps: answer.clarification?.options ?? answer.follow_up_questions,
          clarification: Boolean(answer.clarification),
          showCatalog: needsCatalogGuide(answer),
        });
        set({ conversationId: answer.conversation_id, mood: "joy" });
        clearTimeout(joyTimer);
        joyTimer = setTimeout(() => {
          if (get().mood === "joy") set({ mood: "idle" });
        }, JOY_MS);
      };

      const send = async (question: string) => {
        controller?.abort();
        const current = new AbortController();
        controller = current;
        const answerId = messageId();
        set((state) => ({
          busy: true,
          // Advising: the agent "speaks" for the whole run — retrieval, tool calls and the streamed answer.
          mood: "speaking",
          messages: [
            ...state.messages,
            { id: messageId(), role: "user", text: question },
            { id: answerId, role: "assistant", text: "", status: "streaming", question },
          ],
        }));
        let finished = false;
        try {
          await streamAdvisor(
            { question, conversationId: get().conversationId, locale: "ar" },
            (event) => {
              if (event.type === "token") {
                const message = get().messages.find((item) => item.id === answerId);
                patch(answerId, { text: (message?.text ?? "") + event.text });
              } else if (event.type === "final") {
                finished = true;
                finish(answerId, event.answer);
              } else if (event.type === "error") {
                // A conversation the backend won't continue (closed, another account's): the next question starts fresh.
                finished = true;
                patch(answerId, { status: "error", error: "failed", showCatalog: true });
                set({ conversationId: null, mood: "idle" });
              }
            },
            current.signal,
          );
          if (!finished) {
            patch(answerId, { status: "error", error: "failed", showCatalog: true });
            set({ mood: "idle" });
          }
        } catch (error) {
          if (current.signal.aborted) return;
          patch(answerId, { status: "error", error: error instanceof ApiError && error.status === 429 ? "rate_limited" : "failed" });
          set({ mood: "idle" });
        } finally {
          if (controller === current) {
            controller = null;
            set({ busy: false });
          }
        }
      };

      return {
        open: false,
        expanded: false,
        messages: [],
        conversationId: null,
        busy: false,
        mood: "idle",
        pendingQuestion: null,
        loginOpen: false,
        suggestions: [],

        setOpen: (open) => set(open ? { open, expanded: readExpanded() } : { open }),
        toggleExpanded: () => {
          const expanded = !get().expanded;
          writeExpanded(expanded);
          set({ expanded });
        },
        setSuggestions: (suggestions) => set({ suggestions }),

        ask: async (raw, options) => {
          const question = raw.trim();
          if (!question || get().busy) return;
          const suggested = options?.suggested || get().suggestions.some((item) => sameQuestion(item.question, question));
          if (!suggested && !(await isSignedIn())) {
            set({ pendingQuestion: question, loginOpen: true });
            return;
          }
          await send(question);
        },

        resumePending: () => {
          const question = get().pendingQuestion;
          set({ loginOpen: false, pendingQuestion: null });
          if (!question) return;
          // A new session for the signed-in visitor, starting with the question they asked.
          set({ conversationId: null });
          void send(question);
        },
        closeLogin: () => set({ loginOpen: false }),
        openLogin: () => set({ loginOpen: true }),

        startNewChat: () => {
          controller?.abort();
          controller = null;
          set({ messages: [], conversationId: null, busy: false, mood: "idle", pendingQuestion: null, loginOpen: false });
        },
      };
    },
    {
      name: "ma-advisor",
      version: 1,
      // Per tab and session: the chat follows the visitor around the site, not into tomorrow.
      storage: createJSONStorage(() => sessionStorage),
      partialize: ({ open, messages, conversationId, pendingQuestion }) => ({
        open,
        conversationId,
        pendingQuestion,
        // An answer still streaming when the page reloads never finishes; it comes back as failed, ready to retry.
        messages: messages.map((message) =>
          message.role === "assistant" && message.status === "streaming" ? { ...message, status: "error" as const, error: "failed" as const } : message,
        ),
      }),
      // Hydrate after mount: server HTML and the first client render must both see the closed widget.
      skipHydration: true,
    },
  ),
);

let hydration: Promise<void> | null = null;

export function rehydrateAdvisor(): Promise<void> {
  hydration ??= Promise.resolve(useAdvisorStore.persist.rehydrate()).then(() => {
    if (useAdvisorStore.getState().open) useAdvisorStore.setState({ expanded: readExpanded() });
  });
  return hydration;
}

// Signing out ends the chat: the next visitor at this screen must not read it. Signing in elsewhere
// (another tab) answers a question that was waiting for it.
useAuthStore.subscribe((state, previous) => {
  if (previous.status === "authenticated" && state.status === "unauthenticated") useAdvisorStore.getState().startNewChat();
  if (state.status === "authenticated" && previous.status !== "authenticated" && useAdvisorStore.getState().pendingQuestion) {
    useAdvisorStore.getState().resumePending();
  }
});
