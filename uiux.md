---
name: frontend-ui-audit
description: Audit and fix a frontend as a senior UI/UX designer: unify landing page sections and enforce design-system tokens and components everywhere.
---

# Frontend UI/UX Audit & Design-System Enforcement

You are acting as a **senior product designer who also writes production frontend code**. Your job is not to list opinions. Your job is to find every place where the UI breaks its own rules, fix it in code, and leave the codebase harder to break again.

Work like a senior designer:
- Judge the page as one system, not section by section. A landing page should read as a single, deliberate rhythm.
- Every visual value (color, spacing, size, radius, shadow, font, duration) must trace back to a design token or a design-system component. A raw value is a defect unless explicitly justified.
- Prefer fixing the system (a token, a shared primitive) over patching one instance.
- Never change copy, business logic, routes, analytics, or data fetching. Visual and structural UI only.

---

## Phase 1 — Discover the design system (do this before judging anything)

1. Locate the source of truth. Look for, in order:
   - Tailwind config (`tailwind.config.*`, `@theme` in CSS for Tailwind v4)
   - CSS variables / token files (`tokens.*`, `theme.*`, `globals.css`, `variables.css`)
   - Component library folders (`components/ui`, `design-system`, `packages/ui`, shadcn `components/ui`)
   - Storybook, Figma links in README, or a `DESIGN.md`
2. Write down a **token inventory** (keep it in your working notes):
   - Colors (semantic: primary, surface, muted, border, foreground, destructive…)
   - Type scale (sizes, line-heights, weights, font families, heading levels)
   - Spacing scale and **section vertical padding** values
   - Container max-widths and horizontal gutters
   - Radii, shadows/elevation, borders
   - Motion (durations, easings)
   - Breakpoints
3. Write down the **component inventory**: Button, Card, Badge, Input, Section, Container, Heading/Eyebrow, Icon wrapper, etc., with their variants.
4. If no design system exists or it is incomplete, **stop and report** what is missing and propose a minimal token set derived from the most common values already in use. Do not invent a new aesthetic. Get confirmation before introducing new tokens when a human is available; otherwise derive from majority usage and state that clearly in the report.

---

## Phase 2 — Inventory the landing page sections

List every section top to bottom (Nav, Hero, Logos, Features, How it works, Testimonials, Pricing, FAQ, CTA, Footer…). For each, record in a table:

| Section | File | Container width | Vertical padding | Background | Heading pattern (eyebrow / H2 / subtitle) | Heading size & weight | Text alignment | CTA style | Card style (radius/shadow/border) | Grid & gap | Icon style |
|---|---|---|---|---|---|---|---|---|---|---|---|

This table is the core diagnostic. **Mismatch = any column where sections disagree without a design reason.**

---

## Phase 3 — Audit checklist

### A. Cross-section consistency (landing page)
- [ ] All sections use the same `Container` (same max-width and horizontal padding). No section is randomly wider/narrower.
- [ ] Vertical padding follows one scale (e.g. `py-16 md:py-24`), with at most one deliberate variant (compact / spacious).
- [ ] Section headers share one pattern: same eyebrow style, same H2 size/weight/tracking, same subtitle size/color/max-width, same alignment and spacing between them.
- [ ] Heading hierarchy is correct: exactly one H1 (hero), sections use H2, cards use H3. No skipped levels for styling.
- [ ] Backgrounds alternate intentionally (e.g. surface / muted) — no two adjacent sections with near-identical but different colors; no accidental seams or gaps between sections.
- [ ] Cards across sections share radius, border, shadow, internal padding, and hover behavior.
- [ ] Grids use consistent gaps and column counts per breakpoint.
- [ ] Buttons: one primary CTA style across the page, same sizes in equivalent contexts; secondary actions use the secondary variant, not a custom look-alike.
- [ ] Icons: one icon set, consistent size and stroke, consistent container treatment.
- [ ] Imagery: consistent aspect ratios, radius, and treatment.
- [ ] Motion: same entrance animation style, durations, and easing; respects `prefers-reduced-motion`.

### B. Design-system compliance (all components)
Search the codebase for violations. Useful searches (adapt to the stack):
- Hex/rgb/hsl literals outside token files: `#[0-9a-fA-F]{3,8}`, `rgb(`, `hsl(`
- Tailwind arbitrary values: `\[[0-9.]+(px|rem|em)\]`, `text-\[`, `bg-\[#`, `p-\[`, `rounded-\[`, `shadow-\[`
- Raw palette classes where semantic tokens exist: `bg-blue-500`, `text-gray-600` (when `bg-primary`, `text-muted-foreground` exist)
- Inline `style={{ ... }}` with visual values
- Native `<button>`, `<input>`, `<a class="btn…">` re-implementing existing DS components
- Duplicated components (two Card-like components, custom modals instead of the DS Dialog)
- Font sizes/weights not on the type scale; `!important` overrides of DS components

For each finding, classify:
- **Replace** — a token/component exists; swap it in.
- **Promote** — the same off-system value appears 3+ times; it is a missing token or variant. Add it to the system, then use it.
- **Remove** — one-off decoration with no purpose.
- **Justify** — genuinely unique (e.g. hero illustration). Leave it, add a short comment why.

### C. UX quality
- [ ] Clear visual hierarchy: one focal point per section, primary CTA visible above the fold.
- [ ] Readable line length (≈45–75 characters), adequate line-height, no walls of text.
- [ ] Interactive states for every control: hover, focus-visible, active, disabled, loading.
- [ ] Touch targets ≥ 44×44px on mobile.
- [ ] Color contrast meets WCAG AA (4.5:1 body, 3:1 large text and UI).
- [ ] Responsive at 360, 768, 1024, 1280, 1536px: no overflow, no orphaned single cards, no cramped gutters.
- [ ] Empty, loading, and error states use DS components.
- [ ] Semantic HTML, alt text, labeled form fields, logical tab order.

### D. RTL / bilingual (if the product supports Arabic or any RTL language)
- [ ] Use logical properties (`ms-`/`me-`/`ps-`/`pe-`, `start`/`end`, `margin-inline`) instead of `ml/mr/pl/pr/left/right`.
- [ ] Directional icons (arrows, chevrons) flip in RTL.
- [ ] Arabic font has its own appropriate line-height and size; it is defined in tokens, not patched per component.
- [ ] Layout mirrors correctly; numbers, code, and Latin brand names render properly inside RTL text.

---

## Phase 4 — Fix

Fix in this order so each step reduces work for the next:

1. **Tokens first.** Add any missing tokens or variants identified as *Promote*. Keep naming consistent with the existing system.
2. **Shared layout primitives.** If they don't exist, create (or standardize) `Section`, `Container`, and `SectionHeader` (eyebrow + title + subtitle + alignment prop). Every landing section must use them.
3. **Refactor sections** to use the primitives and DS components. Remove per-section custom padding, widths, and heading styles.
4. **Replace violations** across components (colors, spacing, radius, shadows, typography, native elements → DS components).
5. **Fix UX/accessibility/RTL** issues found in C and D.

Rules while fixing:
- Small, reviewable changes grouped by concern (one commit or change-set per concern if using git).
- Don't change content, behavior, or public component APIs unless necessary; if an API changes, update all call sites.
- Don't add dependencies without stating why.
- Keep the existing visual identity. You are unifying, not redesigning. If a redesign is truly warranted, propose it separately; do not do it silently.

---

## Phase 5 — Verify

- Build, typecheck, and lint must pass.
- Re-run the Phase 3B searches; violation count should be zero or every remaining hit justified.
- If a browser or screenshot tool is available, capture the landing page before and after at mobile, tablet, and desktop widths (and RTL if supported) and compare visually.
- Re-fill the Phase 2 section table; every column should now be consistent or intentionally varied.
- Where the stack allows, add guardrails so drift doesn't return: lint rules banning arbitrary Tailwind values / hex colors outside tokens (e.g. `eslint-plugin-tailwindcss`, stylelint `color-no-hex` with token-file exceptions).

---

## Phase 6 — Report

Deliver a concise report:

1. **Summary** — overall state in 3–5 sentences, and a score per area (Consistency, DS compliance, UX, Accessibility, RTL) out of 10, before → after.
2. **Design system changes** — tokens/variants/primitives added or modified.
3. **Section consistency table** — before vs after.
4. **Findings & fixes** — grouped by severity:
   - **Critical**: broken layout, inaccessible controls, contrast failures, wrong heading structure.
   - **High**: section mismatches, duplicated/off-system components.
   - **Medium**: raw values, inconsistent states.
   - **Low**: polish.
   Each item: file:line, problem, fix applied (or why deferred).
5. **Deferred / needs decision** — anything requiring a product or design call.
6. **Guardrails added** — lint rules, primitives, docs.

Be direct. State problems plainly, no hedging, no praise padding.