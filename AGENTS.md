<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Validation strategy

`next build` and a cold `next dev` compile are slow on this machine. Do not run `npm run build`
after every change, and do not start a second dev server just to check a change.

During implementation:

1. `npm run lint:changed` — ESLint on the files changed or added since the last commit only.
2. `npm run typecheck` — after meaningful TypeScript changes. It catches wrong props, missing
   imports/exports, API type mismatches and invalid arguments without a production build.
3. `npm run check:changed` — both of the above, after a logical unit of work.

Before considering the task complete:

1. `npm run check` — `typecheck` plus ESLint on the whole repo.
2. `npm run build` (or `npm run validate`, which runs `check` then `build`) — once, as the final
   production validation, and only when the user asks for it or the change touches routing,
   caching, config or build output.

If a fast check fails, fix it before running anything more expensive.

To look at a page, use the dev server the user already has running (`npm run dev`, port 3000)
instead of starting another one; ask if it isn't running.

Do not delete `.next`, `node_modules` or other caches unless there is evidence the cache is
corrupted. If `typecheck` fails inside `.next/dev/types` or `.next/types`, regenerate the route
types with `npx next typegen` rather than wiping `.next`.
