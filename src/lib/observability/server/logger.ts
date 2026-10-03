import "server-only";

import { logs, SeverityNumber, type AnyValueMap } from "@opentelemetry/api-logs";

/**
 * Structured server logs. Exporting them through the OTLP logs pipeline means every record that is
 * emitted inside an active span carries the trace/span id automatically, which is what lets a log
 * line in Loki be pivoted to its trace in Tempo. When OTel is not started the global logs API is a
 * no-op, so these calls are always safe.
 */
function logger() {
  return logs.getLogger(process.env.OTEL_SERVICE_NAME?.trim() || "mastery-app");
}

export function logInfo(body: string, attributes?: AnyValueMap): void {
  logger().emit({ severityNumber: SeverityNumber.INFO, severityText: "INFO", body, attributes });
}

export function logWarn(body: string, attributes?: AnyValueMap): void {
  logger().emit({ severityNumber: SeverityNumber.WARN, severityText: "WARN", body, attributes });
}

export function logError(body: string, attributes?: AnyValueMap): void {
  logger().emit({ severityNumber: SeverityNumber.ERROR, severityText: "ERROR", body, attributes });
}
