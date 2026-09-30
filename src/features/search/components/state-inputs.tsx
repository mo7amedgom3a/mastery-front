import { searchEntries, type SearchState } from "../model/params";

type StateInputsProps = {
  state: SearchState;
  /** Params the form edits itself (its own fields replace them). */
  omit: readonly string[];
};

/**
 * Hidden fields that carry the rest of the search through a form submit, so changing one thing
 * (the query, the sort, the side filters) keeps everything else. The page number is never carried:
 * a changed search starts from page 1.
 */
export function StateInputs({ state, omit }: StateInputsProps) {
  return (
    <>
      {searchEntries(state)
        .filter(([name]) => name !== "page" && !omit.includes(name))
        .map(([name, value]) => (
          <input key={`${name}:${value}`} type="hidden" name={name} value={value} />
        ))}
    </>
  );
}
