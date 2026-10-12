"use client";

import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";

import { consultationQueries, sessionAssetSrc, type ConsultationBooking } from "@/lib/api/consultations";
import { formatDateTime } from "@/lib/format";

// Statuses in which the room may have opened, so the session may have files.
const HELD_STATUSES = new Set(["confirmed", "in_progress", "completed", "no_show_customer", "no_show_expert"]);

/**
 * Whiteboard snapshots saved during the session, for both the customer and the expert. Thumbnails
 * are served by this app (`/api/consultations/…/assets/…`), which checks the viewer is a participant.
 */
export function SessionAssets({ booking }: { booking: ConsultationBooking }) {
  const enabled = HELD_STATUSES.has(booking.status);
  const assets = useQuery({ ...consultationQueries.sessionAssets(booking.booking_id), enabled });
  if (!enabled || assets.isPending) return null;
  if (assets.isError) return <p className="m-0 text-sm text-fg-muted">تعذّر تحميل ملفات الجلسة.</p>;

  const snapshots = assets.data.filter((asset) => asset.kind === "snapshot");
  if (!snapshots.length) return null;
  return (
    <section className="flex flex-col gap-3" aria-labelledby={`session-assets-${booking.booking_id}`}>
      <h3 id={`session-assets-${booking.booking_id}`} className="m-0 text-base font-bold">
        ملفات الجلسة
      </h3>
      <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3">
        {snapshots.map((asset, index) => {
          const src = sessionAssetSrc(booking.booking_id, asset.asset_id);
          const label = `لقطة السبورة ${index + 1}`;
          return (
            <li key={asset.asset_id} className="flex flex-col gap-1.5 rounded-panel border border-line p-2">
              <a href={src} target="_blank" rel="noopener" className="block overflow-hidden rounded-panel bg-surface">
                {/* Served by this app with the viewer's session cookie, which next/image's optimizer can't send. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={label} loading="lazy" className="aspect-video w-full object-contain" />
              </a>
              <div className="flex items-center justify-between gap-2 text-xs text-fg-muted">
                <span>
                  {asset.uploader_role === "expert" ? "الخبير" : "العميل"}
                  {asset.created_at ? ` · ${formatDateTime(asset.created_at)}` : null}
                </span>
                <a href={src} download={`whiteboard-${index + 1}.png`} aria-label={`تنزيل ${label}`} className="hover:text-fg">
                  <Download aria-hidden="true" className="size-4" />
                </a>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
