# Observability

Frontend and server telemetry for the app, sent to Grafana Cloud. There are two independent
pipelines that meet in one trace:

```
Browser ── Faro RUM (errors, web vitals, sessions, user actions)
   │        fetch/XHR spans + W3C traceparent
   ▼
Next.js server ── OpenTelemetry (traces, logs, metrics via @vercel/otel)
   │        spans/metrics/logs ──► OTLP gateway ──► Tempo / Loki / Mimir
   ▼
Backend API ── joins the same trace if it honours traceparent
```

The goal is that one request can be followed across all three hops: a frontend error in Faro, the
server span that served it, and the log line that explains it, all sharing a trace id.

## Files

| Path | Runtime | Role |
| --- | --- | --- |
| `src/instrumentation.ts` | Node / Edge | Next.js entry point. `register()` starts the server SDK; `onRequestError` reports server errors. |
| `src/instrumentation-client.ts` | Browser | Next.js entry point. Starts Faro before hydration; records the initial page view and every navigation. |
| `src/lib/observability/faro.ts` | Browser | Faro initialization and the client helpers (`pushFaroError`, `pushFaroEvent`, `syncFaroIdentity`). |
| `src/lib/observability/behavior.ts` | Browser | Typed product/route behavior events, fanned out to Faro and the backend. |
| `src/lib/observability/route-pattern.ts` | Shared | URL → route pattern (+ product) matcher, used by client events and server span tagging. |
| `src/lib/observability/server/otel.ts` | Node | Builds the OTel SDK: instrumentations, exporters, resource attributes, route tagging. |
| `src/lib/observability/server/logger.ts` | Node | Structured logger over the OTel logs API. |

The two `instrumentation*.ts` files are Next.js conventions and are imported by the framework, not
by application code. `server/*` modules are guarded with `import "server-only"`.

## Server pipeline (`@vercel/otel`)

`register()` runs once per server instance and dynamically imports `server/otel`, so the Node-only
dependencies never reach the Edge runtime or the client bundle.

`startOtel()` calls a single `registerOTel()`:

- **Traces** — on Vercel, @vercel/otel's default `fetch` instrumentation plus the platform's
  incoming-request spans; everywhere else (the Docker image) `getNodeAutoInstrumentations()` covers
  incoming HTTP, outgoing `fetch`, and runtime/host metrics. Inbound server spans also carry an
  `http.route` attribute (the route pattern, not the raw URL — see `route-pattern.ts`) so Grafana can
  break rate/errors/latency down per route.
- **Logs** — a `SimpleLogRecordProcessor` writes each record immediately via the OTLP proto
  exporter. The processor instance is kept in the module so `onRequestError` can `forceFlush()` it
  before a serverless invocation ends.
- **Metrics** — a `PeriodicExportingMetricReader` (60s) over the OTLP proto exporter.

All three exporters read the standard `OTEL_EXPORTER_OTLP_*` variables, so traces, logs and metrics
share one endpoint and one auth header.

### Server errors

`onRequestError` is called by Next.js for errors it captures while rendering a route, running a
server action, a route handler, or the proxy. It emits one ERROR log carrying:

- the message, error type and stack trace
- `http.request.method` and `url.path`
- `next.router.kind`, `next.route.path`, `next.route.type`, `error.digest`

Errors handled inside application code (e.g. a route handler returning a 502) are **not** reported
here by design; only genuinely uncaught errors reach this hook.

## Client pipeline (Grafana Faro)

`instrumentation-client.ts` runs after the document loads and before hydration, which is what lets
Faro capture the first errors and web vitals. `initFaro()` is a no-op when `NEXT_PUBLIC_FARO_URL` is
unset, and every call is wrapped so monitoring can never break the app.

Enabled instrumentations:

- `getWebInstrumentations()` — errors, web vitals, console, user actions, sessions.
- `TracingInstrumentation` — fetch/XHR spans and the W3C `traceparent` header. This is what links a
  browser span to the Next.js server span and, when the backend honours the header, to the API.

The `onRouterTransitionStart` export records each App Router navigation, and the file records the
initial load once — both as a Faro `page_view` event (with the route pattern and the product on a
detail page). (The react-router `ReactIntegration` shown in the Grafana docs does not apply here:
the App Router does not use react-router.)

### Error boundaries

React error boundaries swallow render errors before they reach `window.onerror`, so Faro's automatic
capture never sees them. `src/app/error.tsx` and `src/app/global-error.tsx` call `pushFaroError()`
and then render their fallback.

### User identity

`shop-auth-bridge.tsx` calls `syncFaroIdentity(customerId)`: signed-in visitors are keyed by the
opaque `customer_id`, guests fall back to the random `clientFingerprint` already kept in
localStorage. No email or other PII is sent to telemetry; anonymous browsing still links across pages.

## Behavior tracking

Product and route behavior (`behavior.ts`) answers "which course/diploma did someone click, and
where did they go next". Every event fans out to **two sinks** under one taxonomy:

- **Faro** (`pushFaroEvent`) — Grafana dashboards and funnels, correlated with the RUM session,
  trace and any error.
- **Backend** (`trackBehaviorEvent`) — `POST /api/b2c/analytics/events` → the backend
  `/api/v1/analytics/events` (the contract already existed in `src/lib/api/analytics.ts`; it feeds
  the recommendation history the platform owns). Guests are identified by `X-Client-Fingerprint`,
  signed-in visitors additionally by the bearer session the proxy attaches.

Both are fire-and-forget: a tracking failure never blocks navigation or a click, and a no-op when
Faro is unconfigured or the backend is unreachable.

### Events

| Event | Where | Attributes (Faro) / metadata (backend) |
| --- | --- | --- |
| `page_view` | every route change + initial load (Faro only) | `route` pattern, `navigation_type`, product kind/id on detail pages |
| `product_view` | product detail pages | `route`, `kind`, `legacy_entity_id` |
| `product_click` | every product card (all surfaces) | `product_kind`, `legacy_entity_id`, `title`, `surface`, `position` |
| `wishlist_add` / `wishlist_remove` | any wishlist toggle | `product_kind`, `legacy_entity_id`, `title`, `price_amount` |
| `cart_add` / `cart_remove` | any cart toggle; bulk add-all sends one `cart_add` with a count | as above |
| `search` | every search/filter/sort/pagination navigation | query, types, sort, mode, page, facet counts |
| `login_started`, `registered`, `signed_in`, `signed_out`, `auth_gate_opened` | explicit auth actions | — |
| `order_created`, `payment_settled`, `order_viewed` | checkout funnel | order number/status, total, method, outcome |

Click context: `ProductCard` parses kind + id from the detail href, so **every** card surface is
covered with no per-call-site work. Surfaces that know their context also pass
`tracking={{ surface, position }}` (search results, landing rails, related/recommended, expert
rails, wishlist, recommendations).

### Route observability

`route-pattern.ts` maps a path to its pattern (and, for detail pages, the product). It is used twice
so client and server agree:

- client — the `page_view` `route` attribute and product extraction;
- server — the `http.route` attribute stamped on inbound spans (see Phase above).

### Example Grafana queries

- Top clicked products: Faro events where `event_name = product_click`, group by
  `product_kind` + `legacy_entity_id`.
- Funnel: count sessions per step `page_view → product_click → wishlist_add → cart_add →
  order_created` (Logs/Explore on the Faro events, or the backend analytics table).
- Route popularity: `page_view` grouped by `route`.
- Per-route server health: Tempo metrics grouped by `http.route` (rate, error rate, p95 duration).

### Grafana dashboard

`grafana/top-pages-dashboard.json` is an importable dashboard with the pages/behavior views above:
overview stats, top pages (table + treemap "map"), a per-route detail section driven by the `route`
variable, product behavior (most clicked/viewed, funnel), search activity, web vitals, errors, and
server-side per-route RED from Tempo.

Import it with **Dashboards → New → Import → Upload JSON**, then pick the Loki and Tempo data
sources when prompted. The `Route` dropdown defaults to All and is populated from
`route-pattern.ts`; `Faro app id` lists the `app_id` label values, and `OTel service` defaults to
`mastery-app`.

| Panels | Data | Source |
| --- | --- | --- |
| Page views, unique pages, page views over time, top pages, page share | `page_view` events | Loki (`{app_id, kind="event"}`) |
| Page detail, products clicked from a page, funnel | `product_*`, `wishlist_*`, `cart_*`, `order_*` events | Loki |
| Search activity (over time, top terms) | `search` events | Loki |
| Web vitals (TTFB/FCP/LCP/CLS) | `kind="measurement"` | Loki |
| Exceptions | `kind="exception"` | Loki |
| Requests / p95 / errors per route | server spans with `http.route` | Tempo (TraceQL metrics) |

Good to know:

- Grafana Cloud Logs promotes the Faro attributes `app_id`, `kind` and `app_key` to **labels**.
  There is **no `app` label** (that one is for self-hosted Faro → Alloy). The dashboard selects
  `{app_id=~"$app_id", kind="…"}`.
- Every page-scoped event (`product_click`, `wishlist_*`, `cart_*`, `search`, auth, checkout) carries
  the `route` it happened on, so the per-route panels work — not just `page_view`/`product_view`.
- TraceQL metrics queries are capped at a 24-hour window; the dashboard defaults to 6h.
- The Faro event attribute used for pages is our `route` field (a route pattern). If it is absent in
  a given environment, the panels fall back to empty — `page_url` (Faro meta) is present on every
  signal as an alternative grouping key.
- There is no geospatial map: Faro does not send location by default. The "page share" treemap is
  the page map; add a geomap panel only if you enrich signals with a `country` attribute.

#### "No data" on import

Two things must be right: the **data source** and the **label schema**.

- **Data source:** Grafana Cloud provisions several Loki instances; pick the **Grafana Cloud Logs**
  one — its name ends in `-logs` (`grafanacloud-<stack>-logs`). `grafanacloud-<stack>-usage-insights`
  only holds Grafana's own usage logs and never frontend telemetry.
- **Labels:** the Faro telemetry carries `app_id`, `kind`, `app_key` labels (no `app`). Confirm in
  Explore on the Logs data source with `{kind="event"}` (any results = data is arriving), then
  `{kind="event"} | logfmt | event_name="page_view"` (results = the event fields parse).

If `{kind="event"}` is empty, no frontend signal is reaching this stack:

1. Confirm `NEXT_PUBLIC_FARO_URL` is the collector URL from **this** stack's Frontend Observability
   app (it embeds the app key). A URL from another stack writes elsewhere.
2. Make sure the site's origin is listed in the app's **CORS Allowed Origins**, then redeploy —
   `NEXT_PUBLIC_*` is inlined at build time, so a deployment built before the variable existed still
   sends nothing.

The **Server (Tempo)** row needs the server-side `OTEL_*` variables deployed; until then it stays
empty even though Faro's own client traces appear in Tempo.

## Browser ↔ server correlation

The browser puts a `traceparent` header on its requests. The server (via
`getNodeAutoInstrumentations` on Docker, or the Vercel platform on Vercel) reads it and continues the
same trace. Backend calls made with `fetch` propagate it again. One trace therefore spans browser →
Next.js → API, provided the backend accepts W3C trace context.

## Source maps

The build runs with webpack (`next build --webpack`) because the Faro uploader is a webpack plugin.
`next.config.ts` enables `productionBrowserSourceMaps` and, for client production builds only, adds
`FaroSourceMapUploaderPlugin`. It injects the bundle id into the client chunks and uploads the maps
so client stack traces are de-minified in Faro.

- With `FARO_API_KEY` set, maps are uploaded and then removed (`keepSourcemaps` defaults to false),
  so they are never served to visitors.
- Without a key the plugin still injects the bundle id and skips the upload; maps are left in
  `.next/static` for local inspection.

## Environment variables

Client (inlined at build time; see `.env.example`):

- `NEXT_PUBLIC_FARO_URL` — Faro collector URL. Unset disables client telemetry.
- `NEXT_PUBLIC_FARO_APP_NAME` — must match the source-map plugin's `appName`.
- `NEXT_PUBLIC_FARO_APP_NAMESPACE` — `app.environment` (e.g. `production`, `development`).
- `NEXT_PUBLIC_FARO_APP_VERSION` — `app.version`.

Build-time (source-map upload):

- `FARO_API_KEY` — secret; without it uploads are skipped.
- `FARO_API_ENDPOINT`, `FARO_APP_ID`, `FARO_STACK_ID`.

Server (Node runtime only):

- `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`, `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_EXPORTER_OTLP_HEADERS` (`Authorization=Basic <base64 instanceId:token>`).
- `OTEL_SERVICE_VERSION` (optional; falls back to the Vercel/CI commit sha).
- `OTEL_TRACES_SAMPLER` / `OTEL_TRACES_SAMPLER_ARG` (optional; e.g. `parentbased_traceidratio` `0.1`).

`deployment.environment.name` is derived from `NEXT_PUBLIC_ENV`, then `VERCEL_ENV`, then `NODE_ENV`,
so all environments can report into one Grafana stack and still be told apart.

## Enabling and disabling

The server pipeline starts only when **both** the endpoint and a real auth token are set —
`OTEL_EXPORTER_OTLP_HEADERS=Authorization=` (empty) counts as disabled. This keeps a fresh checkout
silent instead of retrying failed exports. The client pipeline starts only when
`NEXT_PUBLIC_FARO_URL` is set.

To turn telemetry off in an environment, remove the relevant variables; no code change is needed.
Dev reports into the same stack tagged `environment=development` (see `.env.local`).

## Deploying to Vercel

Client telemetry only works once the observability code is **deployed** and the build has the
`NEXT_PUBLIC_*` values. `NEXT_PUBLIC_*` is inlined at build time, so adding a variable in Vercel does
nothing until you **redeploy** — an env change alone is not enough.

1. **Set the client variables** for the Production environment (Settings → Environment Variables, or
   `vercel env add <name> production`):
   - `NEXT_PUBLIC_FARO_URL` — the collector URL **from this stack's app** (copy it from Frontend
     Observability → your app → Configuration; it embeds the app key). A URL from another stack
     sends data elsewhere.
   - `NEXT_PUBLIC_FARO_APP_NAME` (`mastery-app`), `NEXT_PUBLIC_FARO_APP_NAMESPACE` (`production`),
     `NEXT_PUBLIC_FARO_APP_VERSION`.
2. **Allow the origin in CORS.** In the Frontend Observability app, add the exact production origin
   under **CORS Allowed Origins** (e.g. `https://emasteryacademy.com`, plus `https://www.…` or a
   `https://*.emasteryacademy.com` wildcard if used). With no match the browser blocks the POST and
   no data ever arrives. Changes take ~2 minutes to propagate.
3. **Redeploy** (`vercel --prod`, or Redeploy in the dashboard) so the new variables are inlined.

### Server-side OTLP variables

The server pipeline (`OTEL_*`) is read at runtime, but a new deployment is still required for Vercel
to inject them. Set, for Production:

- `OTEL_EXPORTER_OTLP_ENDPOINT` — e.g. `https://otlp-gateway-prod-us-central-0.grafana.net/otlp`
  (use the endpoint shown for **your** Grafana Cloud stack).
- `OTEL_EXPORTER_OTLP_PROTOCOL` — `http/protobuf`.
- `OTEL_SERVICE_NAME` — `mastery-app`.
- `OTEL_EXPORTER_OTLP_HEADERS` — `Authorization=Basic <base64(instanceId:token)>`. It is a secret:
  do not prefix it with `NEXT_PUBLIC_`. The endpoint and header are shown together in Grafana Cloud
  under **OpenTelemetry / Send data**; the value must decode to `<instanceID>:<token>`. Generate it
  with `printf 'INSTANCE_ID:TOKEN' | base64 -w0` if you build it by hand.

Vercel dashboard: the value may contain spaces (the dashboard field accepts the whole
`Authorization=Basic …` string). Vercel CLI (quote it, and avoid a trailing newline):

```bash
printf 'Authorization=Basic %s' "$BASE64_INSTANCE_TOKEN" | vercel env add OTEL_EXPORTER_OTLP_HEADERS production
```

While `OTEL_EXPORTER_OTLP_HEADERS` is left as the `Authorization=` placeholder, the server exporter
stays off by design (no failed exports); set the real token to turn it on.

If you later add a `Content-Security-Policy` header, add the Faro collector and OTLP gateway to its
`connect-src` or the browser will block telemetry.

## Verifying

1. `npm run check` — types and lint.
2. `npm run build` — must succeed under webpack; the Faro plugin logs the bundle id and map rewrites.
3. Run the app and load a page, then look in Grafana Cloud:
   - Frontend Observability — events, web vitals, sessions for the Faro app; `page_view` /
     `product_click` / funnel events under the "behavior" domain.
   - Tempo — a trace containing both the browser fetch span and the server span (the server span
     carries `http.route`).
   - Loki — log lines for `onRequestError`, searchable by trace id.
4. Behavior reachability: click a product card and confirm a `POST /api/b2c/analytics/events` in the
   network tab (guests included). The backend endpoint must be running for the event to record.
5. Browser (production): open DevTools → Network, filter for `collect`; you should see a POST to
   `faro-collector-…grafana.net/collect/…` returning 2xx on page load. A CORS error there means the
   origin is missing from CORS Allowed Origins; no request at all means the code isn't deployed or
   `NEXT_PUBLIC_FARO_URL` was empty at build time.
6. To de-minify a client error, confirm the source map upload ran and that `app.name` matches the
   plugin's `appName`.

## Notes

- Metrics are runtime/process (USE-style). Request rate/error/duration (RED) come from traces in
  Grafana. Runtime metrics are reliable on the Docker deployment, less so on short-lived serverless
  functions.
- Backend trace correlation depends on the backend honouring `traceparent`; otherwise its spans
  start a new trace.
- On Vercel the platform adds incoming-request spans; on Docker the auto-instrumentations do.
- Behavior events go to the backend independently of Faro: `NEXT_PUBLIC_FARO_URL` only controls the
  RUM sink. Turning off client telemetry means removing the relevant variables, but the
  `/api/b2c/analytics/events` calls still run (they are first-party).
