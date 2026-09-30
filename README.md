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

## Add a page

Add a `page.tsx` file under `src/app/<route>`. Keep the page focused on data
loading and composition, and place its UI and logic under `src/features`.
