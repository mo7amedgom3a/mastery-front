import type { ReactNode } from "react";

type StudentPageHeaderProps = {
  /** Id placed on the H1, for the page's `aria-labelledby`. */
  id: string;
  title: ReactNode;
  lead?: ReactNode;
  /** Actions at the end of the header row (e.g. a link to all items). */
  actions?: ReactNode;
};

/** Heading of a page inside the student dashboard (the shell already provides container and nav). */
export function StudentPageHeader({ id, title, lead, actions }: StudentPageHeaderProps) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-2">
        <h1 id={id} className="m-0 text-3xl leading-[1.4] font-bold break-words md:text-4xl">
          {title}
        </h1>
        {lead ? <p className="m-0 max-w-[60ch] leading-7 text-fg-muted">{lead}</p> : null}
      </div>
      {actions}
    </header>
  );
}
