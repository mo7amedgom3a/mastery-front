"use client";

import { useQuery } from "@tanstack/react-query";

import { labQueries } from "@/features/labs/api";
import { SchemaLab } from "@/features/labs/components/schema/schema-lab";

export function LabPreviewLoader({ slug }: { slug: string }) {
  const query = useQuery(labQueries.detail(slug, true));

  if (query.isPending) {
    return (
      <div className="ma-container py-16 text-center text-sm text-fg-muted" dir="rtl">
        جارٍ تحميل المختبر…
      </div>
    );
  }
  if (query.isError || !query.data) {
    return (
      <div className="ma-container py-16 text-center text-sm text-fg-muted" dir="rtl">
        تعذّر العثور على المختبر أو أنه غير منشور.
      </div>
    );
  }
  if (query.data.engine !== "schema") {
    return (
      <div className="ma-container py-16 text-center text-sm text-fg-muted" dir="rtl">
        هذا المختبر يعمل بمحرك مخصص ولا يُعرض من المسار التجريبي.
      </div>
    );
  }
  return <SchemaLab runtime={query.data} preview />;
}
