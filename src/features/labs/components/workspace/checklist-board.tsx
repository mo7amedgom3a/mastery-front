"use client";

import { cn } from "@/lib/cn";

import { OptionCard } from "../bits";

export type ChecklistItem = { id: string; label: string; detail?: string; group: string };

/** Grouped checkbox board (close calendar, governance setup, crisis playbook). */
export function ChecklistBoard({
  items,
  groups,
  picked,
  onToggle,
  max,
}: {
  items: readonly ChecklistItem[];
  groups: readonly { id: string; label: string }[];
  picked: readonly string[];
  onToggle: (id: string) => void;
  max?: number;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {groups.map((group) => (
        <div key={group.id} className="flex min-w-0 flex-col gap-2">
          <h3 className={cn("m-0 rounded-photo bg-surface-alt px-3 py-1.5 text-[13px] font-bold")}>{group.label}</h3>
          {items
            .filter((item) => item.group === group.id)
            .map((item) => {
              const selected = picked.includes(item.id);
              return (
                <OptionCard
                  key={item.id}
                  multi
                  selected={selected}
                  disabled={!selected && max !== undefined && picked.length >= max}
                  onSelect={() => onToggle(item.id)}
                  title={item.label}
                  detail={item.detail}
                />
              );
            })}
        </div>
      ))}
    </div>
  );
}
