"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock3, PenLine } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { describedBy, FormError } from "@/features/auth/components/field";
import { ApiError } from "@/lib/api/client";
import { certificateKeys, setMyCertificateName } from "@/lib/api/certificates";
import { cn } from "@/lib/cn";

const LATIN_NAME = /^[A-Za-zÀ-ɏ][A-Za-zÀ-ɏ .'-]{1,118}$/;

/**
 * The English name printed on certificates. Certificates are printed in English, so a name in Arabic
 * letters can't be used; certificates waiting for the name are issued as soon as it is saved.
 */
export function CertificateNameForm({
  current,
  pending,
  certificateTitle,
  onSaved,
}: {
  current: string | null;
  /** Certificates are waiting for the name: shown as the call to action of the page. */
  pending: boolean;
  /** The waiting certificate, when the form is shown for one. */
  certificateTitle?: string;
  onSaved?: () => void;
}) {
  const id = useId();
  const queryClient = useQueryClient();
  const [name, setName] = useState(current ?? "");
  const trimmed = name.trim().replace(/\s+/g, " ");
  const invalid = trimmed.length > 0 && !LATIN_NAME.test(trimmed);
  const save = useMutation({
    mutationFn: () => setMyCertificateName(trimmed),
    onSuccess: (data) => {
      queryClient.setQueryData(certificateKeys.mine(), data);
      void queryClient.invalidateQueries({ queryKey: certificateKeys.all });
      onSaved?.();
    },
  });
  const error = invalid ? "اكتب الاسم بالأحرف الإنجليزية كما تريده على الشهادة." : undefined;
  const hint = "يُطبع على شهاداتك كما هو، مثل: Mohamed Ahmed Gomaa";
  // While certificates wait, saving the name already shown is what issues them.
  const unchanged = !pending && trimmed === (current ?? "");

  return (
    <form
      aria-labelledby={`${id}-title`}
      className={cn(
        "flex flex-col gap-5 rounded-panel border bg-surface p-5 sm:p-6",
        pending ? "border-2 border-yellow" : "border-line-strong",
      )}
      onSubmit={(event) => {
        event.preventDefault();
        if (trimmed && !invalid && !unchanged) save.mutate();
      }}
    >
      {pending ? (
        <div className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-yellow text-ink">
            <PenLine aria-hidden="true" className="size-5" />
          </span>
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="ma-tag ma-tag--yellow self-start">
              <Clock3 aria-hidden="true" className="size-3.5" /> بانتظار الاسم
            </span>
            <h2 id={`${id}-title`} className="m-0 text-lg leading-8 font-bold">
              {certificateTitle ? (
                <>
                  شهادة «<bdi dir="ltr">{certificateTitle}</bdi>» جاهزة، تنقصها خطوة واحدة
                </>
              ) : (
                "شهادتك بانتظار اسمك بالإنجليزية"
              )}
            </h2>
            <p className="m-0 max-w-[60ch] text-sm leading-6 text-fg-muted">
              الشهادات تُطبع باللغة الإنجليزية. أدخل اسمك كما تريده أن يظهر عليها، وسنُصدرها فوراً.
            </p>
          </div>
        </div>
      ) : (
        <h2 id={`${id}-title`} className="sr-only">
          الاسم على الشهادة
        </h2>
      )}

      <div className={cn("ma-field", error && "is-error")}>
        <label htmlFor={id} className="ma-label">
          الاسم على الشهادة (بالإنجليزية)
          <span className="ms-1 text-pink" aria-label="مطلوب">
            *
          </span>
        </label>
        {/* Input and button share one row; the hint sits under both so the button lines up with the input. */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            id={id}
            dir="ltr"
            className="ma-input min-w-0 flex-1"
            autoComplete="name"
            placeholder="Mohamed Ahmed Gomaa"
            maxLength={120}
            value={name}
            onChange={(event) => setName(event.target.value)}
            {...describedBy(id, error, hint)}
          />
          <Button type="submit" className="shrink-0" disabled={!trimmed || invalid || unchanged || save.isPending}>
            {save.isPending ? "جارٍ الحفظ…" : pending ? "احفظ وأصدر الشهادة" : "حفظ الاسم"}
          </Button>
        </div>
        {error ? (
          <p id={`${id}-error`} className="ma-help m-0">
            {error}
          </p>
        ) : (
          <p id={`${id}-hint`} className="ma-help m-0">
            {hint}
          </p>
        )}
      </div>

      {trimmed && !invalid ? (
        <p className="m-0 flex flex-wrap items-baseline gap-x-2 rounded-control bg-surface-alt px-4 py-3 text-sm">
          <span className="text-fg-muted">سيظهر على الشهادة:</span>
          <bdi dir="ltr" className="text-base font-bold">
            {trimmed}
          </bdi>
        </p>
      ) : null}

      <FormError
        message={
          save.isError
            ? save.error instanceof ApiError && save.error.status === 422
              ? "اكتب الاسم بالأحرف الإنجليزية فقط."
              : "تعذّر حفظ الاسم. حاول مجدداً."
            : null
        }
      />
    </form>
  );
}
