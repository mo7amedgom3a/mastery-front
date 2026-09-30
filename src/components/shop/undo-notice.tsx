import { Undo2, X } from "lucide-react";
import type { ReactNode } from "react";

type UndoNoticeProps = {
  children: ReactNode;
  onUndo: () => void;
  onDismiss: () => void;
};

/** "Removed — undo" bar. Announced politely; the action stays reachable by keyboard while it shows. */
export function UndoNotice({ children, onUndo, onDismiss }: UndoNoticeProps) {
  return (
    <div role="status" className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border border-line-strong bg-surface-alt px-4 py-2">
      <p className="m-0 min-w-0 text-sm leading-6">{children}</p>
      <div className="flex shrink-0 items-center gap-1">
        <button type="button" onClick={onUndo} className="ma-btn ma-btn--ghost ma-btn--sm min-h-11 gap-1.5 font-bold">
          <Undo2 aria-hidden="true" className="size-4 fill-none" />
          تراجع
        </button>
        <button type="button" onClick={onDismiss} aria-label="إخفاء" className="ma-btn ma-btn--ghost ma-btn--icon ma-btn--sm size-11">
          <X aria-hidden="true" className="size-4 fill-none" />
        </button>
      </div>
    </div>
  );
}
