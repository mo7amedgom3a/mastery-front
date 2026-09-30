import { Skeleton } from "@/components/ui/skeleton";

/** Held while the placed order is read from storage: a heading, two lines and the order box. */
export function OrderSkeleton() {
  return (
    <div role="status" className="flex max-w-[44rem] flex-col gap-5">
      <span className="sr-only">جارٍ تحميل الطلب…</span>
      <Skeleton className="h-9 w-2/3" />
      <Skeleton className="h-5" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-40" />
    </div>
  );
}
