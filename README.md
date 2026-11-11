# Next.js Frontend

## Structure

- `src/app`: App Router pages, layouts, and route-level files.
- `src/features`: feature-specific components and frontend business logic.
- `src/components/ui`: reusable, backend-independent UI components.
- `src/lib/api`: the typed boundary for all FastAPI requests.
- `src/config`: environment and runtime configuration.
- `src/types`: shared TypeScript contracts.
- `public`: static assets.

Pages should compose features. UI components should not call the backend
directly; keep HTTP requests inside `src/lib/api` and pass typed data as props.

## Run locally

Start the FastAPI backend on port `8000`, then run:

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`. The home page calls
`http://localhost:8000/api/v1/health` on the server and displays its status.

## Checks

```bash
npm run check:changed   # typecheck + ESLint on changed files: the fast loop while coding
npm run check           # typecheck + ESLint on the whole repo
npm run validate        # check + production build: once, before shipping
```

`next build` is slow, so it is the last step, not the loop. See "Validation strategy" in
`AGENTS.md`.

## Deploy (Cloudflare)

Production runs on Cloudflare Workers through the OpenNext adapter (`open-next.config.ts`,
`wrangler.jsonc`) at `landing.masteryacademy.site`.

| Kind | Where | Examples |
|---|---|---|
| Build-time, inlined into the client | `.env.production.local` (gitignored, **no secrets**: OpenNext also bundles it) | `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ENV`, `NEXT_PUBLIC_POSTHOG_*`, `NEXT_PUBLIC_FARO_*`, `NEXT_ENABLE_IMAGE_OPTIMIZATION=true` |
| Runtime, non-secret | `wrangler.jsonc` `vars` | `API_BASE_URL`, `BUNNY_*`, `AUTH_COOKIE_SECURE` |
| Runtime, secret | `npx wrangler secret bulk secrets.prod.json` (delete the file after) | `AUTH_COOKIE_SECRET`, `REVALIDATE_SECRET` (= backend `FRONT_REVALIDATE_SECRET`), `OTEL_EXPORTER_OTLP_HEADERS` |

```bash
npx wrangler login
npm run cf:preview    # build, then serve the Worker locally on workerd (secrets from .dev.vars)
npm run cf:deploy     # build and deploy to production
npm run cf:upload     # build and upload a new version without promoting it
npx wrangler tail     # live logs
```

**CI/CD** (`.github/workflows/cloudflare.yml`): a push to `main` runs the checks, builds and deploys;
a pull request runs the checks and the build only. Build values are in the workflow; it needs the
`CLOUDFLARE_API_TOKEN` secret and the `CLOUDFLARE_ACCOUNT_ID` variable (see the file header).

`npm run cf:build` hides `.env.local` during the build, so local development values never reach
the Worker bundle. Set `FARO_API_KEY` in the shell to upload browser source maps.

One-time resource: `npx wrangler r2 bucket create mastery-front-prod-cache-enam --location enam`
(the page/data cache; the tag cache and revalidation queue are Durable Objects created by the
deploy). Server-side OTel does not run on workerd; server errors go to Workers Logs.

## Add a page

Add a `page.tsx` file under `src/app/<route>`. Keep the page focused on data
loading and composition, and place its UI and logic under `src/features`.
