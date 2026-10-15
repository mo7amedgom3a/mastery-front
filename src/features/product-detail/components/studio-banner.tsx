import { safeUrl, type StudioBannerVM } from "../model/studio-content";

export function StudioBanner({ banner }: { banner: StudioBannerVM | null }) {
  if (!banner || !safeUrl(banner.url)) return null;

  return (
    <div className="relative overflow-hidden rounded-panel border border-line p-6 sm:p-8 md:p-10 min-h-48 flex flex-col justify-end bg-neutral-900">
      <img
        src={banner.url}
        alt={banner.alt || ""}
        className="absolute inset-0 size-full object-cover brightness-[0.45]"
      />
      {banner.headline ? (
        <h2 className="relative z-10 m-0 text-2xl sm:text-3xl font-bold text-white max-w-[40ch] text-pretty">
          {banner.headline}
        </h2>
      ) : null}
    </div>
  );
}
