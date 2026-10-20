"use client";

import { useId, type InputHTMLAttributes } from "react";

import { describedBy, Field } from "@/features/auth/components/field";

import { useRequestStore, type RequestField } from "../model/request-store";

type TextFieldProps = {
  name: RequestField;
  label: string;
  hint?: string;
  multiline?: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "value" | "onChange">;

/** A text answer bound to the request store, with its error from the last "next". */
export function TextField({ name, label, hint, multiline, className, ...input }: TextFieldProps) {
  const id = useId();
  const value = useRequestStore((state) => state[name]);
  const error = useRequestStore((state) => state.errors[name]);
  const update = useRequestStore((state) => state.update);
  const shared = { id, name, value: typeof value === "string" ? value : "", ...describedBy(id, error, hint) };

  return (
    <Field id={id} label={label} error={error} hint={hint}>
      {multiline ? (
        <textarea
          {...shared}
          rows={4}
          maxLength={3000}
          onChange={(event) => update({ [name]: event.target.value })}
          className="ma-input min-h-28 resize-y py-3 leading-7"
        />
      ) : (
        <input {...input} {...shared} onChange={(event) => update({ [name]: event.target.value })} className={className ?? "ma-input"} />
      )}
    </Field>
  );
}
