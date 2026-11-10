"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

/**
 * A modal sheet for the planner editors, on the native <dialog> like the booking dialog. Editors
 * close it by calling `onClose` (unmounting the dialog closes it); Escape, the X and the backdrop
 * close it natively and report through `onClose`.
 */
export function PlannerDialog({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const close = () => ref.current?.close();

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      aria-labelledby={titleId}
      className="m-auto max-h-[calc(100svh-1rem)] w-[min(36rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] overflow-y-auto rounded-panel border border-line-strong bg-surface p-0 text-fg backdrop:bg-ink/70"
    >
      <div className="flex flex-col gap-5 p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 id={titleId} className="m-0 text-xl font-bold">
              {title}
            </h2>
            {subtitle ? <p className="m-0 text-sm text-fg-muted">{subtitle}</p> : null}
          </div>
          <button type="button" onClick={close} aria-label="إغلاق" className="ma-btn ma-btn--bare ma-btn--icon size-10 min-h-10 shrink-0">
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
