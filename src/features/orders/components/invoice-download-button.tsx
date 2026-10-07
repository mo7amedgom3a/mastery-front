"use client";

import { FileDown } from "lucide-react";
import { useState } from "react";

import { getOrderInvoices } from "@/lib/api/commerce";
import { cn } from "@/lib/cn";

const ATTEMPTS = 3;
const RETRY_MS = 2000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** A freshly signed link for one invoice; null while the PDF isn't ready (or storage is down). */
async function freshInvoiceUrl(orderId: string, invoiceId: string): Promise<string | null> {
  for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
    const invoices = await getOrderInvoices(orderId);
    const invoice = invoices.find((entry) => entry.invoice_id === invoiceId) ?? invoices[0];
    const url = invoice?.download_url ?? invoice?.pdf_url ?? null;
    if (url) return url;
    if (attempt < ATTEMPTS - 1) await wait(RETRY_MS);
  }
  return null;
}

/**
 * Downloads an invoice PDF. Its links are signed for about 15 minutes, so a link on screen may have
 * expired: every press asks the backend for a new one. The tab is opened during the click (before
 * the request) so popup blockers let it through, then pointed at the PDF.
 */
export function InvoiceDownloadButton({
  orderId,
  invoiceId,
  label = "تنزيل الفاتورة (PDF)",
  className,
}: {
  orderId: string;
  invoiceId: string;
  label?: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const download = async () => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    const tab = window.open("", "_blank");
    if (tab) tab.opener = null;
    try {
      const url = await freshInvoiceUrl(orderId, invoiceId);
      if (!url) {
        tab?.close();
        setMessage("الفاتورة قيد الإنشاء. حاول مجدداً بعد دقيقة.");
        return;
      }
      if (tab) tab.location.href = url;
      else window.location.assign(url);
    } catch {
      tab?.close();
      setMessage("تعذّر تجهيز رابط الفاتورة. حاول مجدداً.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={() => void download()}
        disabled={busy}
        aria-busy={busy}
        className={cn("ma-btn ma-btn--secondary ma-btn--sm min-h-11 gap-2", busy && "is-loading", className)}
      >
        <FileDown aria-hidden="true" className="size-4 fill-none" />
        {label}
      </button>
      {message ? (
        <p role="status" className="m-0 text-sm text-fg-muted">
          {message}
        </p>
      ) : null}
    </div>
  );
}
