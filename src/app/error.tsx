"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { pushFaroError } from "@/lib/observability/faro";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Route-level error boundary. React boundaries swallow render errors before they reach
 * `window.onerror`, so Faro's automatic error capture never sees them; reporting here keeps client
 * render failures in the same stream as everything else.
 */
export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    pushFaroError(error, error.digest ? { digest: error.digest } : undefined);
  }, [error]);

  return (
    <main id="main" tabIndex={-1} className="outline-none">
      <section aria-labelledby="error-title" className="ma-section">
        <div className="ma-container flex max-w-[40rem] flex-col items-start gap-6">
          <span className="ma-tag ma-tag--soft">خطأ غير متوقّع</span>
          <h1 id="error-title" className="t-section m-0">
            حدث خطأ ما
          </h1>
          <p className="t-lead m-0">
            نأسف على الإزعاج. حاول إعادة المحاولة، وإن استمرت المشكلة فعُد إلينا لاحقًا.
          </p>
          <Button variant="primary" size="lg" onClick={reset}>
            إعادة المحاولة
          </Button>
        </div>
      </section>
    </main>
  );
}
