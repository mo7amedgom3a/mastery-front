import { MessageCircle } from "lucide-react";

import { buttonClass } from "@/components/ui/button";

import { detailCopy } from "../content/copy";
import type { LiveTrainingDetailVM } from "../model/types";

/** Closing kit CTA band: a coral field with the on-colour button, plus WhatsApp for questions. */
export function RegisterBand({ training }: { training: LiveTrainingDetailVM }) {
  return (
    <section id="register" aria-labelledby="register-title" className="bg-coral text-ink">
      <div className="ma-container flex flex-col items-start gap-8 py-16 md:flex-row md:items-end md:justify-between md:py-24">
        <div className="flex max-w-[40rem] flex-col gap-3">
          <h2 id="register-title" className="t-section m-0">
            {detailCopy.register.title}
          </h2>
          <p className="m-0 text-lg">
            {training.cohort ? `${training.cohort} · ` : null}
            {training.dateRange} · {detailCopy.register.lead}
          </p>
          {training.whatsappHref ? <p className="m-0 text-[15px]">{detailCopy.register.whatsappLead}</p> : null}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a href={training.enrollUrl} className={buttonClass({ variant: "on-color", size: "lg" })}>
            {detailCopy.enroll} — <span dir="ltr">{training.price.current}</span>
          </a>
          {training.whatsappHref ? (
            <a
              href={training.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="ma-btn ma-btn--lg border-ink text-ink hover:bg-ink hover:text-white"
            >
              <MessageCircle aria-hidden="true" className="size-5" />
              <span dir="ltr">{training.whatsappLabel}</span>
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
