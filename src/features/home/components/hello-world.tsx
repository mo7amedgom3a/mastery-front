import { StatusBadge } from "@/components/ui/status-badge";
import type { HealthResponse } from "@/types/api";

type HelloWorldProps = {
  health: HealthResponse | null;
};

export function HelloWorld({ health }: HelloWorldProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <section className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <StatusBadge available={health?.status === "healthy"} />

        <h1 className="mt-6 text-4xl font-bold text-slate-950">
          Hello World
        </h1>
        <p className="mt-3 text-lg leading-8 text-slate-600">
          Next.js, strict TypeScript, and Tailwind CSS are ready.
        </p>

        {health && (
          <dl className="mt-8 grid gap-4 border-t border-slate-200 pt-6 sm:grid-cols-3">
            <div>
              <dt className="text-sm text-slate-500">Service</dt>
              <dd className="font-medium text-slate-900">{health.service}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Version</dt>
              <dd className="font-medium text-slate-900">{health.version}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Environment</dt>
              <dd className="font-medium text-slate-900">
                {health.environment}
              </dd>
            </div>
          </dl>
        )}
      </section>
    </main>
  );
}
