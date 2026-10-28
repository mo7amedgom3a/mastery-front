import "server-only";

import { cache } from "react";

import { ApiError } from "@/lib/api/client";
import { verifyCertificate, type CertificateVerification } from "@/lib/api/certificates";

/** Kept short so a revoked certificate stops showing as valid quickly. Keep in sync with the page. */
export const VERIFY_REVALIDATE_SECONDS = 60;

const CODE_PATTERN = /^[A-Za-z0-9-]{4,40}$/;

/** The backend's verdict for a certificate ID No; one fetch per request (metadata, page and OG image). */
export const loadVerification = cache(async (rawCode: string): Promise<CertificateVerification | null> => {
  const code = decodeURIComponent(rawCode).trim();
  if (!CODE_PATTERN.test(code)) {
    return notFound(code);
  }
  try {
    return await verifyCertificate(code, { next: { revalidate: VERIFY_REVALIDATE_SECONDS } });
  } catch (error) {
    if (error instanceof ApiError && error.status === 429) return null;
    console.error("[verify] certificate lookup failed", code, error);
    return null;
  }
});

function notFound(code: string): CertificateVerification {
  return {
    status: "not_found",
    public_code: code,
    recipient_name: null,
    title: null,
    issued_at: null,
    training_hours: null,
    cpd: false,
    cpd_hours: null,
    issuer: "Mastery Academy",
    revoked_at: null,
    legacy: false,
  };
}
