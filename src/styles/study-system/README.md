# "study" design-system test layer

A scoped, opt-in copy of the design tokens exported from **study.emasteryacademy.com** (Peek export,
`study.emasteryacademy.com-styles-2026-11-12.css` in the repo root). It is kept as a reference
specimen only: the app itself always uses the Mastery Academy kit, and these tokens load on the
`/preview/design-system` route alone.

## Turning it on

The specimen page sets `data-ds="study"` on its own panels, so it shows both palettes without
touching the app. The old floating switch, `?ds=study` / `?ds=default` query handling, the
`localStorage["ma-ds"]` key and the pre-paint script were removed in November 2026: the current
Mastery kit is now the only design system in the app. Delete the `ma-ds` key from a browser if it
was set by an older build; it is no longer read.

## What applies, and what does not

When `data-ds="study"` is present on an element (the specimen panels):

- **Colours:** the app role tokens (`--surface`, `--surface-alt`, `--text`, `--text-muted`,
  `--line`, `--line-strong`, `--accent`, `--on-accent`, `--focus`) and brand tokens (`--coral`,
  `--ink`, `--yellow`, …) are remapped to export values, so every `.ma-*` component and Tailwind
  colour utility inside that element retints.
- **Fonts:** `--font-sans` and `--font-arabic` point at the export's DIN Next LT Arabic stack,
  aliased to IBM Plex Sans Arabic because the licensed WOFF files are not bundled. Roboto is
  aliased to Raleway.
- **Bare semantic elements:** headings, paragraphs, links, buttons, form controls, lists, tables,
  quotes, code, captions and the rest use the exported type styles (`src/styles/study-system/type.css`).
- **Not changed:** `.ma-*` component layout/typography, `.t-*` display classes, Tailwind text
  utilities, spacing, radii and shadows. The export contains no geometry tokens, so the kit's
  geometry stays. This keeps the test additive and easy to review.

The specimen page at `/preview/design-system` renders the full palette, the 5 gradients, all 34
effective type styles and a semantic-element matrix in both palettes. It is `noindex` and already
covered by the `/preview/` robots rule.

## File map

| File | Contents |
|---|---|
| `tokens.css` | 93 raw colours, 5 gradients, 9 sizes, 10 tracking tokens, 2 font stacks — all prefixed `--ds-` |
| `theme.css` | App role/brand mapping, light + synthesized dark, font aliases |
| `type.css` | 34 scoped `.type-*` classes and the semantic element mapping |
| `../../app/preview/design-system/preview.css` | Route-local import of the three files above, in `layer(base)` |
| `../../app/preview/design-system/layout.tsx` | Imports `preview.css` for the specimen route only |
| `../../features/design-system-test/*` | Specimen manifests and page body |

The specimen route is the only importer. Global element rules use `:where([data-ds="study"]) h1`
(specificity 0,0,1), so preflight is overridden but every class/utility still wins.

## Prefixing and fidelity

The export's raw names were prefixed with `--ds-` to avoid collisions with the app's Tailwind theme
(`--color-purple` already exists) and Tailwind's `--text-*`, `--tracking-*`, `--font-*` namespaces.
Values are verbatim except the two font stacks. Class names (`.type-*`) are preserved and scoped
under `[data-ds="study"]`; the blog's own `.blog-theme .type-*` rules are unlayered and keep winning
inside the blog.

The export declares 39 type styles across 34 class names: `.type-caption-12-500` (3 declarations),
`.type-caption-12-600`, `.type-subheading-15-600` and `.type-small-11-700` are repeated. `type.css`
keeps the effective (last-wins) declaration of each.

## Role mapping

Light (`data-theme="light"` or a scope with no theme):

| Role | Export token | Value |
|---|---|---|
| `--surface` | `--ds-color-white` | `#ffffff` |
| `--surface-alt` | `--ds-color-ghost-white-1` | `#f8f9fa` |
| `--text` | `--ds-color-dark-gray-1` | `#1f1f1f` |
| `--text-muted` | `--ds-color-dim-gray` | `#616161` (AA; `#757575` is borderline on white) |
| `--line` | `--ds-color-lavender-1` | `#e5e7eb` |
| `--line-strong` | `--ds-color-light-gray` | `#d1d5db` |
| `--accent` | `--ds-color-tomato-3` | `#ff6555` |
| `--on-accent` | `--ds-color-dark-gray-1` | `#1f1f1f` (≈6.5:1 on coral) |
| `--focus` | `--ds-color-steel-blue-1` | `#3f51b5` |

Dark (`data-theme="dark"`), synthesized because the export has no dark palette:

| Role | Value |
|---|---|
| `--surface` | `#1a1a1a` (`--ds-color-dark-gray`) |
| `--surface-alt` | `#242424` (`--ds-color-dark-gray-3`) |
| `--text` | `#ffffff` |
| `--text-muted` | `#b0b0b0` (`--ds-color-dark-gray-10`) |
| `--line` / `--line-strong` | white at 16% / 32% |
| `--on-accent` | `#1a1a1a` |
| `--focus` | `#d4c7ff` (`--ds-color-lavender-2`) |

Brand roles map to `tomato-3` (coral), `dark-gray` (ink), `pastel-orange-1` (yellow),
`medium-purple`, `royal-blue-1`, `deep-pink-1`, `light-sea-green-1`, `lavender-2`, `lime-green`,
`white-smoke-2` (cream), white and black. `--ink` stays dark in both themes because it is the text
colour on brand fields.

## Known differences from the reference

- DIN Next LT Arabic and Roboto are replaced by IBM Plex Sans Arabic and Raleway, so metrics are
  close but not identical. The font variables are the only place to change when the licensed files
  arrive.
- Geometry (spacing, radii, shadows) is absent from the export and intentionally untouched.
- The dark palette is an interpretation, not an export.
- `--on-accent` is dark for contrast; if the reference uses white on coral, that is a deliberate
  deviation (white on `#ff6555` is ≈2.9:1).
- Hard-coded colours in TSX (charts, whiteboard, advisor, OG images) are not tokens and do not
  retint.

## Rollback

Delete this folder, the `preview/design-system` route (page, layout and `preview.css`) and the
`design-system-test` feature. No existing token values or kit files are modified, so deleting the
specimen cannot affect the app.

## History

The floating switch, the `?ds=` query handling, the `localStorage["ma-ds"]` key and the pre-paint
`DesignSystemScript` were removed on 2026-11-15 so the current Mastery kit is the only design
system in the app. The specimen remains as a route-local reference.
