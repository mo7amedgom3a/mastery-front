import { clsx as cn } from "clsx";

import { BidiText, isolateRuns, textDir } from "@/components/content/bidi";

import { advisorCopy } from "../content/copy";
import { useAdvisorStore } from "../model/store";
import type { ChatMessage } from "../model/types";
import { AdvisorAgent } from "./advisor-agent";
import { AdvisorCatalogGuide } from "./advisor-catalog-guide";
import { AdvisorMarkdown } from "./advisor-markdown";
import { AdvisorProductCard } from "./advisor-product-card";

const LIST_ITEM = /^\s*([-*•]|\d+[.)])\s/;

/**
 * The backend writes plain lines ("• item", one point per line); markdown would run them together.
 * Bullets become list items, a list is set apart from the text around it, and other lines keep their break.
 */
function keepLineBreaks(text: string): string {
  const lines = text.split("\n").map((line) => line.replace(/^(\s*)• /, "$1- "));
  return lines
    .map((line, index) => {
      const next = lines[index + 1];
      if (next === undefined || !line.trim() || !next.trim()) return line;
      const listHere = LIST_ITEM.test(line);
      const listNext = LIST_ITEM.test(next);
      if (listHere !== listNext) return `${line}\n`;
      return listHere ? line : `${line}  `;
    })
    .join("\n");
}

/** One turn of the chat: the visitor's question, or the advisor's answer with its products and follow-ups. */
export function AdvisorMessage({ message, expanded }: { message: ChatMessage; expanded: boolean }) {
  const busy = useAdvisorStore((state) => state.busy);
  const ask = useAdvisorStore((state) => state.ask);

  if (message.role === "user") {
    const dir = textDir(message.text);
    return (
      <div className="flex justify-end">
        <p dir={dir} className="m-0 max-w-[85%] rounded-panel rounded-se-chip bg-(--fill-soft) px-3.5 py-2.5 text-start text-sm leading-7 whitespace-pre-wrap">
          <span className="sr-only">{advisorCopy.you}: </span>
          {isolateRuns(message.text, dir)}
        </p>
      </div>
    );
  }

  const thinking = message.status === "streaming" && !message.text;
  const products = message.products ?? [];
  const followUps = message.status === "done" ? (message.followUps ?? []) : [];

  return (
    <div className="flex items-start gap-2">
      <AdvisorAgent variant="compact" mood={message.status === "streaming" ? "speaking" : "idle"} className="mt-1 size-9 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="max-w-full self-start rounded-panel rounded-ss-chip border border-line bg-surface-alt px-3.5 py-2.5" aria-busy={message.status === "streaming"}>
          {thinking ? (
            <p className="m-0 animate-pulse text-sm leading-7 text-fg-muted">{advisorCopy.thinking}</p>
          ) : message.status === "error" ? (
            <div className="flex flex-col items-start gap-2">
              <p role="alert" className="m-0 text-sm leading-7">
                {message.error === "rate_limited" ? advisorCopy.rateLimited : advisorCopy.failed}
              </p>
              {message.question ? (
                <button type="button" disabled={busy} onClick={() => void ask(message.question, { suggested: true })} className="ma-btn ma-btn--soft ma-btn--sm min-h-11">
                  {advisorCopy.retry}
                </button>
              ) : null}
            </div>
          ) : (
            <AdvisorMarkdown source={keepLineBreaks(message.text)} dir={textDir(message.text)} />
          )}
        </div>

        {products.length ? (
          <div className={cn("grid gap-2", expanded && "sm:grid-cols-2")}>
            {products.map((product, index) => (
              <AdvisorProductCard key={product.product_id} product={product} position={index + 1} />
            ))}
          </div>
        ) : null}

        {message.showCatalog && products.length === 0 ? <AdvisorCatalogGuide failed={message.status === "error"} /> : null}

        {followUps.length ? (
          <div className="flex flex-col gap-2">
            <p className="m-0 text-xs font-medium text-fg-muted">
              {message.clarification ? advisorCopy.clarificationTitle : advisorCopy.followUpsTitle}
            </p>
            <div className="flex flex-wrap gap-2">
              {followUps.map((question) => (
                <button
                  key={question}
                  type="button"
                  disabled={busy}
                  onClick={() => void ask(question)}
                  className="ma-btn ma-btn--soft ma-btn--sm h-auto min-h-11 py-2 text-start leading-6 whitespace-normal"
                >
                  <BidiText text={question} />
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
