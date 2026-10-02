"use client";

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import type { ComponentProps } from "react";
import { DayPicker } from "react-day-picker";
import { arSA } from "react-day-picker/locale";

import { cn } from "@/lib/cn";

export type CalendarProps = ComponentProps<typeof DayPicker>;

/**
 * shadcn/ui Calendar (react-day-picker) dressed in the design kit: role tokens, square corners, no
 * shadows, the kit's focus ring. Arabic and right-to-left by default, with Latin digits like the
 * rest of the site. Cells stretch with the container and stay close to the 44px touch target.
 *
 * Day state is styled from the cell (`selected`, `today`, `disabled` …) onto its button, so the
 * library's own day button, which moves focus for keyboard users, is kept as is.
 */
export function Calendar({ className, classNames, components, showOutsideDays = false, ...props }: CalendarProps) {
  return (
    <DayPicker
      locale={arSA}
      dir="rtl"
      numerals="latn"
      showOutsideDays={showOutsideDays}
      className={cn("w-full bg-surface text-fg", className)}
      classNames={{
        months: "relative flex flex-col gap-6",
        month: "flex w-full flex-col gap-3",
        nav: "absolute inset-x-0 top-0 z-10 flex items-center justify-between",
        button_previous: "ma-btn ma-btn--bare ma-btn--icon size-11 min-h-11 aria-disabled:opacity-30",
        button_next: "ma-btn ma-btn--bare ma-btn--icon size-11 min-h-11 aria-disabled:opacity-30",
        chevron: "size-5 fill-none",
        month_caption: "flex h-11 items-center justify-center px-12",
        caption_label: "text-base font-bold select-none",
        month_grid: "w-full table-fixed border-collapse",
        weekdays: "",
        weekday: "h-9 p-0 text-center text-xs font-medium text-fg-muted select-none",
        week: "",
        day: "p-px text-center",
        day_button:
          "relative grid aspect-square w-full cursor-pointer place-items-center border border-transparent bg-transparent p-0 font-[inherit] text-[15px] font-medium tabular-nums text-fg transition-colors duration-150 hover:border-line-strong disabled:cursor-not-allowed disabled:hover:border-transparent",
        today: "[&>button]:border-line",
        selected: "[&>button]:border-accent [&>button]:bg-accent [&>button]:font-bold [&>button]:text-on-accent",
        outside: "[&>button]:text-fg-muted",
        disabled: "[&>button]:font-normal [&>button]:text-fg-muted [&>button]:opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ className: chevronClassName, orientation }) => {
          // The library always asks for "left" on the previous button; in RTL that button sits on
          // the right, so the arrows are mirrored.
          const Icon = orientation === "left" ? ChevronLeft : orientation === "right" ? ChevronRight : ChevronDown;
          return <Icon aria-hidden="true" className={cn("rtl:rotate-180", chevronClassName)} />;
        },
        ...components,
      }}
      {...props}
    />
  );
}
