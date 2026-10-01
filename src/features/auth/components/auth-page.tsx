import type { Route } from "next";
import type { ReactNode } from "react";

import { AppLink } from "@/components/ui/app-link";

type AuthPageProps = {
  /** Id placed on the H1, for the section's `aria-labelledby`. */
  id: string;
  title: string;
  lead: string;
  /** The way to the other auth page, under the form. */
  alternative: { question: string; label: string; href: Route };
  children: ReactNode;
};

/** Shared frame of the sign-in and registration pages: one narrow column with the form in a panel. */
export function AuthPage({ id, title, lead, alternative, children }: AuthPageProps) {
  return (
    <section aria-labelledby={id} className="ma-section">
      <div className="ma-container">
        <div className="mx-auto flex max-w-[30rem] flex-col gap-8">
          <header className="flex flex-col gap-3">
            <h1 id={id} className="t-h2 m-0">
              {title}
            </h1>
            <p className="m-0 leading-7 text-fg-muted">{lead}</p>
          </header>
          <div className="border border-line-strong bg-surface p-5 sm:p-8">{children}</div>
          <p className="m-0 text-fg-muted">
            {alternative.question}{" "}
            <AppLink href={alternative.href} prefetch className="ma-link">
              {alternative.label}
            </AppLink>
          </p>
        </div>
      </div>
    </section>
  );
}
