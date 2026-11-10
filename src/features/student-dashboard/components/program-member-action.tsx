"use client";

import { useQuery } from "@tanstack/react-query";
import type { Route } from "next";

import { AppLink } from "@/components/ui/app-link";
import { commerceQueries } from "@/lib/api/commerce";
import { studentConsultationHref, studentProgramHref } from "@/lib/shop/product-links";

import { ContinueLearningButton } from "./continue-learning-button";

type ProgramMemberActionProps = {
  /** Catalog slug of the resource, matched against the customer's entitlements. */
  slug: string;
  kind: string;
  title: string;
  /** The resource's own page, when the catalog has one. */
  href: Route | null;
};

/** What a bundle/package resource can open: the LMS when it is granted, its own page otherwise. */
const LAUNCHABLE = new Set(["course", "diploma"]);

/**
 * A resource inside a bundle or package acts like a separately bought product: once the purchase
 * granted it an entitlement, "continue learning" opens the LMS for it.
 */
export function ProgramMemberAction({ slug, kind, title, href }: ProgramMemberActionProps) {
  // One small ownership read per member (404 means "not owned"); the LMS is never asked here.
  const owned = useQuery(commerceQueries.ownedProduct(slug));
  const access = owned.data?.access_status === "active" ? owned.data : null;

  if (access && LAUNCHABLE.has(kind)) {
    return (
      <ContinueLearningButton
        entitlementId={access.entitlement_id}
        fulfillmentStatus={access.fulfillment_status}
        title={title}
        variant="soft"
        size="sm"
        block={false}
        label="كمّل التعلّم"
      />
    );
  }

  if (kind === "package") {
    const contents = studentProgramHref("package", slug);
    if (contents) {
      return (
        <AppLink href={contents} className="ma-btn ma-btn--soft ma-btn--sm">
          عرض محتوى الباقة
        </AppLink>
      );
    }
  }

  if (kind === "consultation") {
    const consultation = studentConsultationHref(slug) ?? href;
    if (consultation) {
      return (
        <AppLink href={consultation} className="ma-btn ma-btn--soft ma-btn--sm">
          تفاصيل الاستشارة
        </AppLink>
      );
    }
  }

  return null;
}
