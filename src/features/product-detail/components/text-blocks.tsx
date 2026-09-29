import { Check } from "lucide-react";

import { cn } from "@/lib/cn";
import type { TextBlock } from "@/lib/format";

type TextBlocksProps = {
  blocks: readonly TextBlock[];
  /** `check` renders every list as a check-list (course goals). */
  listStyle?: "default" | "check";
  className?: string;
};

/** Plain-text paragraphs and lists parsed from legacy rich text; never raw HTML. */
export function TextBlocks({ blocks, listStyle = "default", className }: TextBlocksProps) {
  return (
    <div className={cn("flex max-w-[68ch] flex-col gap-4 text-base leading-8 text-fg", className)}>
      {blocks.map((block, index) => {
        if (block.type === "p") {
          return (
            <p key={index} className="m-0 text-pretty">
              {block.text}
            </p>
          );
        }
        if (listStyle === "check") {
          return (
            <ul key={index} className="m-0 grid list-none gap-3 p-0">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="flex items-start gap-3">
                  <span className="mt-1 grid size-6 shrink-0 place-items-center rounded-full bg-green text-ink">
                    <Check aria-hidden="true" className="size-4" strokeWidth={2.5} />
                  </span>
                  <span className="text-pretty">{item}</span>
                </li>
              ))}
            </ul>
          );
        }
        const List = block.ordered ? "ol" : "ul";
        return (
          <List
            key={index}
            className={cn("m-0 grid gap-2 ps-6 marker:text-accent", block.ordered ? "list-decimal" : "list-disc")}
          >
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex} className="ps-1 text-pretty">
                {item}
              </li>
            ))}
          </List>
        );
      })}
    </div>
  );
}
