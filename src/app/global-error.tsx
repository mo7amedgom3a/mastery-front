"use client";

import { useEffect } from "react";

import { pushFaroError } from "@/lib/observability/faro";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Last-resort boundary for errors thrown in the root layout itself. It replaces the whole
 * document, so it ships its own <html>/<body> and inline styles rather than relying on the app's
 * stylesheet, which may be what failed to load.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    pushFaroError(error, error.digest ? { digest: error.digest } : undefined);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body style={{ margin: 0, background: "#17161b", color: "#f4f4f5", fontFamily: "Tahoma, sans-serif" }}>
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
        >
          <div style={{ maxWidth: "32rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <h1 style={{ margin: 0, fontSize: "1.75rem" }}>حدث خطأ ما</h1>
            <p style={{ margin: 0, lineHeight: 1.7, opacity: 0.8 }}>
              تعذّر تحميل الصفحة. حاول إعادة المحاولة.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                cursor: "pointer",
                border: 0,
                borderRadius: "0.5rem",
                padding: "0.75rem 1.5rem",
                background: "#f4f4f5",
                color: "#17161b",
                fontWeight: 600,
                alignSelf: "flex-start",
              }}
            >
              إعادة المحاولة
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
