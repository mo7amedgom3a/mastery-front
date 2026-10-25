"use client";

import { Hourglass, LifeBuoy, LoaderCircle, PlayCircle } from "lucide-react";
import type { Route } from "next";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { AppLink } from "@/components/ui/app-link";
import { buttonClass } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { commerceKeys } from "@/lib/api/commerce";
import { launchLms } from "@/lib/api/lms";
import { cn } from "@/lib/cn";

type ContinueLearningButtonProps = {
  entitlementId: string;
  /** `fulfilled`, `in_progress`, `attention_required`, or null when nothing is delivered by the LMS. */
  fulfillmentStatus?: string | null;
  /** Read by screen readers after the visible label (the program's name). */
  title?: string;
};

/**
 * Opens the LMS (study.emasteryacademy.com) already signed in: `/api/lms/launch` sets the LMS
 * session cookie, then the browser goes there. Until the LMS enrollment is delivered the button
 * says so instead.
 */
export function ContinueLearningButton({ entitlementId, fulfillmentStatus, title }: ContinueLearningButtonProps) {
  const queryClient = useQueryClient();
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const className = cn(buttonClass({ variant: "primary", block: true }), "gap-2");

  if (fulfillmentStatus === "in_progress") {
    return (
      <button type="button" disabled className={cn(buttonClass({ variant: "soft", block: true }), "gap-2")}>
        <Hourglass aria-hidden="true" className="size-5 fill-none" />
        جاري تجهيز وصولك
      </button>
    );
  }
  if (fulfillmentStatus === "attention_required") {
    return (
      <AppLink href={"/students/support" as Route} className={cn(buttonClass({ variant: "soft", block: true }), "gap-2")}>
        <LifeBuoy aria-hidden="true" className="size-5 fill-none" />
        تواصل مع الدعم لتفعيل الوصول
      </AppLink>
    );
  }

  async function open() {
    setOpening(true);
    setError(null);
    try {
      const { redirectUrl } = await launchLms(entitlementId);
      window.location.assign(redirectUrl);
    } catch (caught) {
      setOpening(false);
      setError(caught instanceof ApiError ? caught.message : "تعذّر فتح منصة التعلّم حالياً.");
      // The access changed since the list loaded (suspended, revoked or expired): show its real state.
      if (caught instanceof ApiError && (caught.status === 403 || caught.status === 404)) {
        void queryClient.invalidateQueries({ queryKey: commerceKeys.all });
      }
    }
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={open}
        disabled={opening}
        aria-label={title ? `كمّل التعلّم: ${title}` : undefined}
        className={className}
      >
        {opening ? (
          <LoaderCircle aria-hidden="true" className="size-5 animate-spin fill-none" />
        ) : (
          <PlayCircle aria-hidden="true" className="size-5 fill-none" />
        )}
        كمّل التعلّم
      </button>
      {error ? (
        <p role="alert" className="m-0 text-center text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
