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

## Practice labs

`/labs` is a public, `noindex` demo of scripted practice simulations (sales, marketing, HR and
management) with scoring and catalog recommendations. It runs through an endpoint-shaped mock API
(`src/features/labs/api`) that persists to the browser; `NEXT_PUBLIC_LABS_API_MODE=live` switches
to the future backend. The feature lives in `src/features/labs`; its review — field coverage, gaps
against the catalog and the Academy, the mock/service architecture and the roadmap — is in
[`src/features/labs/README.md`](src/features/labs/README.md).

`npm run test:labs` checks the simulation engines and `npm run test:labs:api` checks the mock API
contract. The same README has the checklist for adding a lab and the proposed authoring model.

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
`wrangler.jsonc`) on the company Cloudflare account, at
`https://landing.emasteryacademy.com` (a CNAME to `service.emastery.dev`, managed outside this
account; the Worker also answers on `https://mastery-front-prod.m-gomaa-55a.workers.dev`).
The backend is `https://api.v3.emasteryacademy.com`.

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

**CD — Cloudflare Workers Builds** (Worker → Settings → Builds, connected to this GitHub repo):
a push to `main` runs `npm run cf:build` then `npx opennextjs-cloudflare deploy`. Workers Builds
has no `.env.production.local`, so the build-time values are **build variables** on that settings
page: `NEXT_PUBLIC_DEPLOY_TARGET=cloudflare`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ENV`,
`NEXT_ENABLE_IMAGE_OPTIMIZATION`, `API_BASE_URL`, `BUNNY_CDN_HOSTNAME`, `NEXT_PUBLIC_ADMIN_ORIGIN`,
`NEXT_PUBLIC_FARO_*`, `NEXT_PUBLIC_POSTHOG_*`, `NEXT_PUBLIC_TOLT_*`, `NODE_VERSION`, `NODE_OPTIONS`.
Runtime vars stay in `wrangler.jsonc`; secrets stay on the Worker.

**CI — GitHub Actions** (`.github/workflows/cloudflare.yml`): typecheck, lint and the OpenNext
build on pushes and pull requests. It never deploys.

`npm run cf:build` hides `.env.local` during the build, so local development values never reach
the Worker bundle. Set `FARO_API_KEY` in the shell to upload browser source maps.

One-time resource: `npx wrangler r2 bucket create mastery-front-prod-cache-enam --location enam`
(the page/data cache; the tag cache and revalidation queue are Durable Objects created by the
deploy). Server-side OTel does not run on workerd; server errors go to Workers Logs.

## Add a page

Add a `page.tsx` file under `src/app/<route>`. Keep the page focused on data
loading and composition, and place its UI and logic under `src/features`.
