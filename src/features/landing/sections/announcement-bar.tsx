import type { BannerVM } from "../model/types";

/** First CMS banner as a slim bar above the header. Renders nothing when there is none. */
export function AnnouncementBar({ banner }: { banner: BannerVM | null }) {
  if (!banner) {
    return null;
  }
  return (
    <div className="bg-yellow text-ink">
      <p className="ma-container flex min-h-10 items-center justify-center py-2 text-center text-sm font-medium">
        {banner.href ? (
          <a href={banner.href} className="text-ink underline decoration-2 underline-offset-4">
            {banner.text}
          </a>
        ) : (
          banner.text
        )}
      </p>
    </div>
  );
}
