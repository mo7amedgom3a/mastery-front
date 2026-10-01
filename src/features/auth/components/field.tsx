import { clsx as cn } from "clsx";
import type { ReactNode } from "react";

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  /** Shown under the control while there is no error. */
  hint?: string;
  children: ReactNode;
};

/** Kit `.ma-field`: label, control, and a hint or error the control points at via `aria-describedby`. */
export function Field({ id, label, error, hint, children }: FieldProps) {
  return (
    <div className={cn("ma-field", error && "is-error")}>
      <label htmlFor={id} className="ma-label">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="ma-help m-0">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="ma-help m-0">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** `aria-*` for a control inside `Field`. */
export function describedBy(id: string, error?: string, hint?: string) {
  return {
    "aria-invalid": error ? (true as const) : undefined,
    "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
  };
}

/** A failed submit, announced to screen readers when it appears. */
export function FormError({ message }: { message: string | null }) {
  return message ? (
    <div className="ma-alert ma-alert--danger" role="alert">
      <p className="ma-alert__text">{message}</p>
    </div>
  ) : null;
}
