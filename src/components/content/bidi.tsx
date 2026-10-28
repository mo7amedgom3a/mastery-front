import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

export type TextDir = "rtl" | "ltr";

const ARABIC = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/g;
const LATIN = /[A-Za-z]/g;
const FIRST_STRONG = /[A-Za-z؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;
/** Invisible joiners copied in from catalog titles; they only confuse the layout. */
const INVISIBLE = /[⁠​﻿]/g;

/**
 * A Latin run inside Arabic text: words, numbers and codes that belong together ("129.00 USD",
 * "OKR’s", "business/management, finance", "C++"). Sentence punctuation at its ends stays outside,
 * so it follows the paragraph's direction.
 */
const LATIN_TOKEN = String.raw`[A-Za-z0-9$](?:[A-Za-z0-9.'’/&+#%$_-]*[A-Za-z0-9+#%$])?`;
const LATIN_RUN = new RegExp(`${LATIN_TOKEN}(?:(?:\\s+|,\\s*)${LATIN_TOKEN})*`, "g");
/** An Arabic run inside English text. */
const ARABIC_RUN = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿](?:[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿\s،]*[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿])?/g;

/**
 * Reading direction of a piece of text. Arabic is the default: English only wins when the text starts
 * with it and is mostly English, so "أبغى دورة Python" stays right-to-left and "What about SQL?" doesn't.
 */
export function textDir(text: string): TextDir {
  const arabic = text.match(ARABIC)?.length ?? 0;
  const latin = text.match(LATIN)?.length ?? 0;
  if (!latin) return "rtl";
  if (!arabic) return "ltr";
  const first = text.match(FIRST_STRONG)?.[0] ?? "";
  return /[A-Za-z]/.test(first) && latin > arabic ? "ltr" : "rtl";
}

/** Splits text so each run of the other script sits in its own `<bdi>`, isolated from its neighbours. */
export function isolateRuns(text: string, dir: TextDir, keyPrefix = "b"): ReactNode[] {
  const clean = text.replace(INVISIBLE, "");
  const pattern = dir === "rtl" ? LATIN_RUN : ARABIC_RUN;
  const runDir: TextDir = dir === "rtl" ? "ltr" : "rtl";
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of clean.matchAll(pattern)) {
    const run = match[0];
    // Bare numbers read the same either way; only runs with letters need isolating.
    if (dir === "rtl" && !/[A-Za-z]/.test(run)) continue;
    const start = match.index ?? 0;
    if (start > last) parts.push(clean.slice(last, start));
    parts.push(
      <bdi key={`${keyPrefix}${start}`} dir={runDir}>
        {run}
      </bdi>,
    );
    last = start + run.length;
  }
  if (last < clean.length) parts.push(clean.slice(last));
  return parts;
}

/** `isolateRuns` over React children: text is split, elements are walked into. */
export function isolateChildren(children: ReactNode, dir: TextDir, keyPrefix = "c"): ReactNode {
  return Children.map(children, (child, index) => {
    if (typeof child === "string") return isolateRuns(child, dir, `${keyPrefix}${index}-`);
    if (isValidElement<{ children?: ReactNode }>(child) && child.props.children !== undefined && child.type !== "bdi") {
      return cloneElement(child as ReactElement<{ children?: ReactNode }>, undefined, isolateChildren(child.props.children, dir, `${keyPrefix}${index}-`));
    }
    return child;
  });
}

/** Text with its own direction and isolated foreign runs, for chips, titles and bubbles. */
export function BidiText({ text, className }: { text: string; className?: string }) {
  const dir = textDir(text);
  return (
    <bdi dir={dir} className={className}>
      {isolateRuns(text, dir)}
    </bdi>
  );
}
