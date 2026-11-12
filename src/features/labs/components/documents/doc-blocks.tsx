"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/cn";

import { chosenOption, type DocBlock } from "./doc-types";

/**
 * Renderers for one A4 page's blocks. Sizes are in `em` so the viewer's zoom (which scales the
 * page font size) scales everything together.
 */
export function DocBlockView({
  block,
  redlines,
  activeClause,
  onClauseSelect,
}: {
  block: DocBlock;
  redlines?: Readonly<Record<string, string>>;
  activeClause?: string | null;
  onClauseSelect?: (id: string) => void;
}) {
  switch (block.kind) {
    case "paragraph":
      return <p className={cn("m-0 text-[1em] leading-[1.9]", block.muted && "text-[#5b6170]")}>{block.text}</p>;

    case "callout":
      return (
        <p
          className={cn(
            "m-0 rounded-[0.4em] border-s-[0.3em] px-[0.9em] py-[0.6em] text-[0.92em] leading-[1.8]",
            block.tone === "warn" && "border-[#d97706] bg-[#fff7e6]",
            block.tone === "good" && "border-[#16a34a] bg-[#ecfdf3]",
            block.tone === "info" && "border-[#2563eb] bg-[#eff6ff]",
          )}
        >
          {block.text}
        </p>
      );

    case "clause": {
      const options = block.options ?? [];
      const redlinable = options.length > 0;
      const option = redlinable ? chosenOption(block, redlines ?? {}) : undefined;
      const changed = Boolean(option && option !== options[0]);
      const active = activeClause === block.id;
      const chip = redlinable ? <RedlineChip label={changed && option ? option.label : "قابل للتعديل"} pending={!changed} /> : null;
      const body = (
        <>
          {onClauseSelect || changed ? chip : null}
          <span className="font-bold">
            {block.number ? <span dir="ltr">{block.number}</span> : null}
            {block.number && block.title ? " " : null}
            {block.title ? `${block.title}: ` : null}
          </span>
          {changed && option ? (
            <>
              <del className="bg-[#fde8ec] text-[#9f1239] decoration-[#be123c] decoration-[0.08em]">{block.text}</del>{" "}
              <ins className="bg-[#e6f7ec] text-[#14532d] no-underline [text-decoration:underline_#16a34a_0.08em]">{option.text}</ins>
            </>
          ) : (
            <span>{block.text}</span>
          )}
        </>
      );
      if (!redlinable || !onClauseSelect) {
        return (
          <p className="m-0 text-[1em] leading-[1.9]">{body}</p>
        );
      }
      return (
        <div className="relative">
          <button
            type="button"
            aria-pressed={active}
            onClick={() => onClauseSelect(block.id)}
            className={cn(
              "block w-full cursor-pointer rounded-[0.3em] px-[0.4em] py-[0.2em] text-start text-[1em] leading-[1.9] transition-colors",
              active ? "bg-[#fff4c2] ring-2 ring-[#eab308]" : changed ? "bg-transparent hover:bg-[#f4f6fa]" : "bg-[#fffbe6] hover:bg-[#fff4c2]",
            )}
          >
            {body}
          </button>
        </div>
      );
    }

    case "table":
      return (
        <div className="overflow-hidden rounded-[0.3em] border border-[#d5d9e2]">
          <table className="w-full border-collapse text-[0.92em] leading-[1.7]">
            <thead>
              <tr className="bg-[#f1f3f7]">
                {block.head.map((cell) => (
                  <th key={cell} className="border-b border-[#d5d9e2] px-[0.7em] py-[0.45em] text-start font-bold">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r} className="even:bg-[#fafbfc]">
                  {row.map((cell, c) => (
                    <td key={c} className="border-b border-[#eceef3] px-[0.7em] py-[0.4em] align-top">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            {block.foot ? (
              <tfoot>
                <tr className="bg-[#f1f3f7] font-bold">
                  {block.foot.map((cell, c) => (
                    <td key={c} className="px-[0.7em] py-[0.45em]">
                      {cell}
                    </td>
                  ))}
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      );

    case "fields":
      return (
        <div className="grid grid-cols-2 gap-[0.6em]">
          {block.fields.map((field) => (
            <div key={field.label} className={cn("flex flex-col gap-[0.2em]", field.wide && "col-span-2")}>
              <span className="text-[0.78em] text-[#5b6170]">{field.label}</span>
              <span
                className={cn(
                  "min-h-[2.1em] rounded-[0.25em] border border-[#c9ced9] px-[0.6em] py-[0.25em] text-[0.95em] leading-[1.6]",
                  field.empty ? "bg-[#fafbfc] text-[#9aa1ae] italic" : "bg-[#f6f9ff] font-semibold text-[#1e3a8a]",
                )}
              >
                {field.value}
              </span>
            </div>
          ))}
        </div>
      );

    case "checks":
      return (
        <div className="flex flex-col gap-[0.4em]">
          {block.title ? <span className="text-[0.85em] font-bold">{block.title}</span> : null}
          {block.items.map((item) => (
            <div key={item.label} className="flex items-start gap-[0.5em] text-[0.95em] leading-[1.6]">
              <span
                aria-hidden
                className={cn(
                  "mt-[0.2em] flex size-[1.1em] shrink-0 items-center justify-center rounded-[0.15em] border",
                  item.checked ? "border-[#1e3a8a] bg-[#1e3a8a] text-white" : "border-[#9aa1ae] bg-white",
                )}
              >
                {item.checked ? <Check className="size-[0.8em]" strokeWidth={3.5} /> : null}
              </span>
              <span className={cn(!item.checked && "text-[#5b6170]")}>
                {item.label}
                {item.note ? <span className="text-[0.85em] text-[#5b6170]"> · {item.note}</span> : null}
              </span>
            </div>
          ))}
        </div>
      );

    case "signatures":
      return (
        <div className="grid grid-cols-2 gap-[1.2em] pt-[0.6em]">
          {block.parties.map((party) => (
            <div key={party.role} className="flex flex-col gap-[0.3em]">
              <span className="text-[0.8em] text-[#5b6170]">{party.role}</span>
              <span className="relative flex h-[3.2em] items-end border-b-2 border-[#1f2430] pb-[0.2em]">
                {party.signed ? (
                  <span className="font-[cursive] text-[1.5em] leading-none text-[#1e3a8a] italic">{party.name.split(" ")[0]}</span>
                ) : (
                  <span className="text-[0.8em] text-[#9aa1ae]">بانتظار التوقيع</span>
                )}
              </span>
              <span className="text-[0.85em] font-semibold">{party.name}</span>
              {party.date ? <span className="text-[0.75em] text-[#5b6170]">{party.date}</span> : null}
            </div>
          ))}
        </div>
      );
  }
}

function RedlineChip({ label, pending = false }: { label: string; pending?: boolean }) {
  return (
    <span
      className={cn(
        "me-[0.4em] inline-block rounded-full px-[0.6em] py-[0.05em] align-[0.1em] text-[0.68em] leading-[1.6] font-bold whitespace-nowrap print:hidden",
        pending ? "bg-[#eab308] text-[#1f2430]" : "bg-[#16a34a] text-white",
      )}
    >
      {label}
    </span>
  );
}
