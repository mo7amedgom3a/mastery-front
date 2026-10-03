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
| `src/instrumentation-client.ts` | Browser | Next.js entry point. Starts Faro before hydration; forwards App Router navigations. |
| `src/lib/observability/faro.ts` | Browser | Faro initialization and the client helpers (`pushFaroError`, `setFaroUser`, `trackFaroNavigation`). |
| `src/lib/observability/server/otel.ts` | Node | Builds the OTel SDK: instrumentations, exporters, resource attributes. |
| `src/lib/observability/server/logger.ts` | Node | Structured logger over the OTel logs API. |

The two `instrumentation*.ts` files are Next.js conventions and are imported by the framework, not
by application code. `server/*` modules are guarded with `import "server-only"`.

## Server pipeline (`@vercel/otel`)

`register()` runs once per server instance and dynamically imports `server/otel`, so the Node-only
dependencies never reach the Edge runtime or the client bundle.

`startOtel()` calls a single `registerOTel()`:

- **Traces** — on Vercel, @vercel/otel's default `fetch` instrumentation plus the platform's
  incoming-request spans; everywhere else (the Docker image) `getNodeAutoInstrumentations()` covers
  incoming HTTP, outgoing `fetch`, and runtime/host metrics.
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

The `onRouterTransitionStart` export records each App Router navigation as an event. (The
react-router `ReactIntegration` shown in the Grafana docs does not apply here: the App Router does
not use react-router.)

### Error boundaries

React error boundaries swallow render errors before they reach `window.onerror`, so Faro's automatic
capture never sees them. `src/app/error.tsx` and `src/app/global-error.tsx` call `pushFaroError()`
and then render their fallback.

### User identity

`ShopAuthBridge` calls `setFaroUser({ id })` with the opaque `customer_id` on sign-in and clears it
on sign-out. No email or other PII is sent to telemetry.

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

## Verifying

1. `npm run check` — types and lint.
2. `npm run build` — must succeed under webpack; the Faro plugin logs the bundle id and map rewrites.
3. Run the app and load a page, then look in Grafana Cloud:
   - Frontend Observability — events, web vitals, sessions for the Faro app.
   - Tempo — a trace containing both the browser fetch span and the server span.
   - Loki — log lines for `onRequestError`, searchable by trace id.
4. To de-minify a client error, confirm the source map upload ran and that `app.name` matches the
   plugin's `appName`.

## Notes

- Metrics are runtime/process (USE-style). Request rate/error/duration (RED) come from traces in
  Grafana. Runtime metrics are reliable on the Docker deployment, less so on short-lived serverless
  functions.
- Backend trace correlation depends on the backend honouring `traceparent`; otherwise its spans
  start a new trace.
- On Vercel the platform adds incoming-request spans; on Docker the auto-instrumentations do.
