"use client";

import { CalendarPlus } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";

import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";

// Loaded on first open: most cards are never extended.
const ExtendAccessDialog = dynamic(() => import("./extend-access-dialog").then((module) => module.ExtendAccessDialog));

/** "Extend access" on an access card that is ending soon or has ended. */
export function ExtendAccessButton({ entitlementId, title, primary = false }: { entitlementId: string; title: string; primary?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`تمديد الوصول: ${title}`}
        className={cn(buttonClass({ variant: primary ? "primary" : "soft", block: true }), "gap-2")}
      >
        <CalendarPlus aria-hidden="true" className="size-5 fill-none" />
        تمديد الوصول
      </button>
      {open ? <ExtendAccessDialog entitlementId={entitlementId} title={title} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
