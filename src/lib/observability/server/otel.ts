import "server-only";

import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-proto";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { SimpleLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { ATTR_DEPLOYMENT_ENVIRONMENT_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";
import { registerOTel } from "@vercel/otel";

/**
 * The log processor is created here (rather than left to @vercel/otel's `"auto"`) so we keep a
 * handle to it: `onRequestError` flushes it before the serverless function is frozen.
 */
let logProcessor: SimpleLogRecordProcessor | undefined;

/**
 * Whether the server should export telemetry. Both the OTLP endpoint and a real auth token must be
 * present, so a checkout without Grafana Cloud credentials (or a placeholder header) stays silent
 * instead of logging export failures.
 */
export function isOtelEnabled(): boolean {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim();
  const headers = process.env.OTEL_EXPORTER_OTLP_HEADERS?.trim();
  if (!endpoint || !headers) return false;
  // `Authorization=` with nothing after it is the example placeholder: not a usable token.
  return headers.replace(/^Authorization=\s*/i, "").length > 0;
}

/**
 * Environment label carried on every span/log/metric: explicit `NEXT_PUBLIC_ENV` wins, then
 * Vercel's own environment, then Node's. Used to separate dev/staging/prod data in one Grafana stack.
 */
function deploymentEnvironment(): string {
  return (
    process.env.NEXT_PUBLIC_ENV?.trim() ||
    process.env.VERCEL_ENV?.trim() ||
    process.env.NODE_ENV ||
    "development"
  );
}

function serviceVersion(): string | undefined {
  return (
    process.env.OTEL_SERVICE_VERSION?.trim() ||
    process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
    process.env.GIT_COMMIT_SHA?.trim() ||
    undefined
  );
}

/**
 * Registers the OpenTelemetry SDK once per server instance. Traces, logs and metrics all point at
 * the OTLP endpoint/headers from the standard `OTEL_EXPORTER_OTLP_*` variables (Grafana Cloud).
 *
 * On Vercel the platform supplies incoming-request spans and the recommended `fetch`
 * instrumentation, so we keep @vercel/otel's defaults. On any other host (the Docker image) the
 * Node auto-instrumentations cover incoming HTTP and outgoing fetch, plus runtime metrics.
 */
export function startOtel(): void {
  if (!isOtelEnabled()) return;

  const attributes: Record<string, string> = {
    [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: deploymentEnvironment(),
  };
  const version = serviceVersion();
  if (version) attributes[ATTR_SERVICE_VERSION] = version;

  logProcessor = new SimpleLogRecordProcessor({ exporter: new OTLPLogExporter() });

  registerOTel({
    serviceName: process.env.OTEL_SERVICE_NAME?.trim() || "mastery-app",
    attributes,
    instrumentations: process.env.VERCEL
      ? ["fetch"]
      : getNodeAutoInstrumentations({
          // Off by default and very chatty; the rest of the defaults are the useful set.
          "@opentelemetry/instrumentation-host-metrics": { enabled: true },
        }),
    logRecordProcessors: [logProcessor],
    metricReaders: [
      new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter(),
        exportIntervalMillis: 60_000,
      }),
    ],
  });
}

/** Flush buffered log records. No-op when OTel was never started. */
export async function flushOtel(): Promise<void> {
  await logProcessor?.forceFlush();
}
