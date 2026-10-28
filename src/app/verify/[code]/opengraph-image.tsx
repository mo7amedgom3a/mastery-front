import { ImageResponse } from "next/og";

import { getApiBaseUrl } from "@/config/env";
import { loadVerification } from "@/features/verify/api/load-verification";

export const alt = "Mastery Academy certificate";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 60;

const INK = "#131317";
const CORAL = "#F25255";

/** The backend's 1200x630 preview (the certificate on the brand background), or null. */
async function certificatePreview(code: string): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(
      `${getApiBaseUrl()}/certificates/verify/${encodeURIComponent(code)}/image.png?layout=og`,
      { next: { revalidate: 300 }, signal: AbortSignal.timeout(20_000) },
    );
    return response.ok ? await response.arrayBuffer() : null;
  } catch {
    return null;
  }
}

/**
 * Link preview of a verification link (LinkedIn, X, WhatsApp, Facebook): the certificate itself, or a
 * branded text card when there is no image (legacy, revoked, unknown). English, like the certificate.
 */
export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const result = await loadVerification(code);
  const valid = result?.status === "valid";
  // The certificate itself (composed by the backend: embedding a large image here breaks the renderer).
  const preview = valid && !result.legacy ? await certificatePreview(result.public_code) : null;
  if (preview) {
    return new Response(preview, { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=300" } });
  }

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#ffffff", color: INK, fontFamily: "sans-serif" }}>
        <div style={{ width: 24, height: "100%", background: CORAL }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, fontWeight: 700 }}>
            <div style={{ width: 18, height: 18, background: CORAL }} />
            MasteryAcademy
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ fontSize: 30, color: valid ? "#15803d" : "#b91c1c", fontWeight: 700 }}>
              {valid ? "Verified Certificate of Completion" : "Certificate verification"}
            </div>
            {valid ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.1 }}>{result.recipient_name}</div>
                <div style={{ fontSize: 40, lineHeight: 1.25, color: "#3f3f46" }}>{result.title}</div>
              </div>
            ) : (
              <div style={{ fontSize: 56, fontWeight: 800 }}>Verify any Mastery Academy certificate</div>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: "#52525b" }}>
            <span>{valid ? `ID No: ${result.public_code}` : "masteryacademy.site/verify"}</span>
            <span>Mastery Online Training Solutions</span>
          </div>
        </div>
        <div style={{ width: 24, height: "100%", background: CORAL }} />
      </div>
    ),
    size,
  );
}
