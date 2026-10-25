"use client";

import { useEffect, useMemo, useState } from "react";

import { routes } from "@/config/routes";
import type { StudioDocument } from "@/features/product-detail/model/studio-content";
import type { QrMatrix } from "@/features/product-detail/model/qr";
import type { InfoSectionVM } from "@/features/product-detail/model/types";
import { toTextBlocks } from "@/lib/format";
import { noPricing } from "@/lib/pricing";

import { BundleDetailPage } from "../bundle-detail-page";
import { bundlePricing } from "../content/pricing";
import { bundleGroupTitles, compositionOf, withBundleStudioDocument } from "../model/mappers";
import type { BundleDetailVM, BundleMemberKind, BundleMemberVM } from "../model/types";

type AdminMember = { product_id: string; slug: string; title: string | null; product_type: string; status: string };
type AdminBundle = {
  product_id: string; slug: string; title: string | null; short_description: string | null;
  description: string | null; amount: number | string; access_duration_days: number | null;
  members: AdminMember[]; learning_outcomes?: string[];
};

function draftBundle(base: AdminBundle): BundleDetailVM {
  const sections: InfoSectionVM[] = [];
  if (base.description) sections.push({ heading: "عن الحزمة", blocks: toTextBlocks(base.description), variant: "prose" });
  if (base.learning_outcomes?.length) sections.push({
    heading: "ماذا ستتعلم في هذه الحزمة؟",
    blocks: [{ type: "list", ordered: false, items: base.learning_outcomes }],
    variant: "goals",
  });
  const members: BundleMemberVM[] = base.members.map((item, index) => {
    const kind: BundleMemberKind = ["course", "diploma", "consultation", "package"].includes(item.product_type)
      ? item.product_type as BundleMemberKind : "other";
    return {
      key: item.product_id, kind, position: index + 1, title: item.title || item.slug,
      summary: null, image: null, href: null, category: null, people: [], duration: null,
      lessonCount: 0, units: [], price: noPricing,
    };
  });
  const groups: BundleDetailVM["groups"] = [];
  for (const member of members) {
    const group = groups.find((item) => item.kind === member.kind);
    if (group) group.members.push(member);
    else groups.push({ kind: member.kind, title: bundleGroupTitles[member.kind], members: [member] });
  }
  return {
    slug: base.slug, productId: base.product_id, title: base.title || base.slug,
    summary: base.short_description, image: null, description: base.description,
    sections,
    readme: null, content: null, banner: null, skills: [], categories: [], members, groups,
    composition: compositionOf(base.members), trainers: [],
    access: base.access_duration_days ? `وصول لمدة ${base.access_duration_days} يوم` : null,
    ...bundlePricing({ amount: Number(base.amount) }), href: routes.bundle(base.slug),
  };
}

/** The public bundle page with the current Studio draft; draft-only bundles use admin data. */
export function BundlePreview({ base, revision, document, readme }: {
  base: unknown; revision: number; document: StudioDocument; readme: string | null;
}) {
  const admin = base as AdminBundle | null;
  const slug = admin?.slug ?? "";
  const [payload, setPayload] = useState<{ bundle: BundleDetailVM | null; qr: QrMatrix } | null>(null);
  const [loadedSlug, setLoadedSlug] = useState("");
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    fetch(`/api/preview/bundle?slug=${encodeURIComponent(slug)}&v=${revision}`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<{ bundle: BundleDetailVM | null; qr: QrMatrix }> : null)
      .then((value) => { if (!cancelled) { setPayload(value); setLoadedSlug(slug); } })
      .catch(() => { if (!cancelled) { setPayload(null); setLoadedSlug(slug); } });
    return () => { cancelled = true; };
  }, [slug, revision]);

  const bundle = useMemo(() => {
    if (!admin) return null;
    const current = loadedSlug === slug && payload?.bundle ? payload.bundle : draftBundle(admin);
    return withBundleStudioDocument(current, document, readme, admin);
  }, [admin, slug, loadedSlug, payload, document, readme]);

  return bundle ? <BundleDetailPage bundle={bundle} qr={payload?.qr ?? null} /> : <div dir="rtl" className="p-8">جارٍ تحميل الحزمة…</div>;
}
