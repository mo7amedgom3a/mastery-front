import { SiteHeader } from "@/components/layout/site-header";
import { CardSkeleton, Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";

/**
 * Shown the moment someone navigates to `/` while the landing data loads. The real header keeps the
 * chrome still; the hero and first catalog rail are placeholders with the same footprint.
 */
export default function HomeLoading() {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <div role="status">
          <span className="sr-only">جارٍ التحميل…</span>
          <div aria-hidden="true">
            <section className="bg-surface-alt">
              <div className="ma-container flex min-h-[min(calc(100svh-var(--header-h)),64rem)] items-center py-[clamp(2rem,6svh,6rem)]">
                <div className="flex w-full max-w-[34rem] flex-col items-start gap-6 md:w-[44%]">
                  <Skeleton className="h-8 w-40" />
                  <div className="flex w-full flex-col gap-3">
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-3/4" />
                  </div>
                  <div className="flex w-full flex-col gap-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-5/6" />
                  </div>
                  <div className="flex w-full gap-3 max-sm:flex-col">
                    <Skeleton className="h-12 w-44 max-sm:w-full" />
                    <Skeleton className="h-12 w-44 max-sm:w-full" />
                  </div>
                </div>
              </div>
            </section>
            <div className="ma-container py-[clamp(1.5rem,5svh,3.5rem)]">
              <ul className="m-0 grid list-none gap-6 p-0 sm:grid-cols-2 md:grid-cols-3">
                {[0, 1, 2].map((index) => (
                  <li
                    key={index}
                    className={cn("overflow-hidden rounded-panel border border-line", index > 0 && "max-sm:hidden", index > 1 && "max-md:hidden")}
                  >
                    <CardSkeleton />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
