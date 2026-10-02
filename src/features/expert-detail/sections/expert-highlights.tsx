import { Check, UserRound } from "lucide-react";

type ExpertHighlightsProps = {
  /** First name-ish label for the headings, e.g. "د. مظهر قنطقجي". */
  name: string;
  whatTheyDo: readonly string[];
  whoTheyHelp: readonly string[];
};

/**
 * كيف يساعدك: what the expert works on and who they work with. The points are lifted by the API from
 * the expert's own consultations and courses (nothing is written for the page), so the section is
 * left out for experts whose services list none.
 */
export function ExpertHighlights({ name, whatTheyDo, whoTheyHelp }: ExpertHighlightsProps) {
  if (whatTheyDo.length === 0 && whoTheyHelp.length === 0) {
    return null;
  }
  return (
    <section id="highlights" aria-labelledby="highlights-title" className="scroll-mt-[calc(var(--header-h)+4.5rem)]">
      <h2 id="highlights-title" className="m-0 text-2xl font-bold">
        كيف يساعدك {name}
      </h2>
      <div className="mt-8 grid gap-10 md:grid-cols-2 md:gap-12">
        {whatTheyDo.length > 0 ? (
          <div className="flex flex-col gap-5">
            <h3 className="m-0 text-lg font-bold">ما الذي يقدّمه</h3>
            <ul className="m-0 grid list-none gap-3 p-0 leading-8">
              {whatTheyDo.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 grid size-6 shrink-0 place-items-center rounded-full bg-green text-ink">
                    <Check aria-hidden="true" className="size-4" strokeWidth={2.5} />
                  </span>
                  <span className="text-pretty">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {whoTheyHelp.length > 0 ? (
          <div className="flex flex-col gap-5">
            <h3 className="m-0 text-lg font-bold">لمن يقدّم خبرته</h3>
            <ul className="m-0 grid list-none gap-3 p-0">
              {whoTheyHelp.map((item) => (
                <li key={item} className="flex items-start gap-3 rounded-panel border border-line p-4 leading-7">
                  <UserRound aria-hidden="true" className="mt-1 size-5 shrink-0 text-accent" />
                  <span className="text-pretty">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
