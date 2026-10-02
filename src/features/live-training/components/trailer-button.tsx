"use client";

import { clsx as cn } from "clsx";
import { Play, X } from "lucide-react";
import { useId, useRef, useState } from "react";

type TrailerButtonProps = {
  /** YouTube embed URL (with autoplay: the click already asked for playback). */
  embedUrl: string;
  /** Video title, for the iframe and the dialog heading. */
  title: string;
  label: string;
  dialogLabel: string;
  className?: string;
};

/**
 * "Watch trailer" button + full-screen player. The iframe exists only while the dialog is open, so
 * nothing from YouTube loads before the click and closing (button, Esc, backdrop) stops playback.
 * The native dialog traps focus and hands it back to the button on close.
 */
export function TrailerButton({ embedUrl, title, label, dialogLabel, className }: TrailerButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const titleId = useId();

  const show = () => {
    setOpen(true);
    dialogRef.current?.showModal();
  };
  const close = () => dialogRef.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={show}
        aria-haspopup="dialog"
        className={cn("ma-btn ma-btn--soft ma-btn--lg", className)}
      >
        <Play aria-hidden="true" className="size-4 fill-current" />
        {label}
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          // Click on the backdrop (the dialog element itself) closes it.
          if (event.target === event.currentTarget) close();
        }}
        aria-labelledby={titleId}
        data-theme="dark"
        className="m-auto w-[min(64rem,calc(100vw-2rem))] max-w-none overflow-hidden rounded-panel border border-line bg-surface-alt p-0 text-fg backdrop:bg-ink/90"
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-2">
          <h2 id={titleId} className="m-0 truncate text-base font-bold">
            {dialogLabel}: {title}
          </h2>
          <button type="button" onClick={close} aria-label="إغلاق" className="ma-btn ma-btn--bare ma-btn--icon size-11 min-h-11">
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
        <div className="relative aspect-video bg-ink">
          {open ? (
            <iframe
              src={embedUrl}
              title={title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              className="absolute inset-0 block size-full border-0"
            />
          ) : null}
        </div>
      </dialog>
    </>
  );
}
