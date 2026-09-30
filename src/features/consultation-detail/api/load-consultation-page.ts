import "server-only";

import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { parseProductSlug } from "@/config/routes";
import { baseOpenGraph, siteConfig } from "@/config/site";
import { isPublishable } from "@/features/landing/model/mappers";

import type { ConsultationDetailData } from "../model/types";
import { getConsultationDetail } from "./get-consultation-detail";

/** Names that already say what they are ("استشارة …", "إستشارة …", "برنامج …") get no "استشارة" prefix. */
const SELF_DESCRIBING = /^(?:[اإ]ستشار|برنامج|جلسة)/;

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

async function consultationForSlug(slug: string): Promise<ConsultationDetailData | null> {
  const id = parseProductSlug(safeDecode(slug));
  const data = id === null ? null : await getConsultationDetail(id);
  // Inactive and admin-test consultations are kept off the storefront, like their cards.
  if (
    !data ||
    !isPublishable({
      active: data.consultation.indexable,
      name: data.consultation.title,
      image: data.consultation.image,
    })
  ) {
    return null;
  }
  return data;
}

/**
 * Data for `/consultations/[slug]`. 404s unknown or unpublished ids; consultations have no link
 * name, so any `/consultations/{id}-…` permanently redirects to the canonical `/consultations/{id}`.
 */
export async function loadConsultationPage(slug: string): Promise<ConsultationDetailData> {
  const data = await consultationForSlug(slug);
  if (!data) {
    notFound();
  }
  if (safeDecode(`/consultations/${slug}`) !== data.consultation.href) {
    permanentRedirect(data.consultation.href);
  }
  return data;
}

/** Metadata from the same cached request the page makes; unknown ids get the 404 page's defaults. */
export async function consultationMetadata(slug: string): Promise<Metadata> {
  const data = await consultationForSlug(slug);
  if (!data) {
    return {};
  }
  const { consultation } = data;
  const named = SELF_DESCRIBING.test(consultation.title) ? consultation.title : `استشارة ${consultation.title}`;
  // "… مع د. مظهر قنطقجي": people search for the expert as much as the topic.
  const title = consultation.expert ? `${named} مع ${consultation.expert.name}` : named;
  const description = consultation.description ?? consultation.summary ?? siteConfig.description;
  return {
    title,
    description,
    alternates: {
      canonical: consultation.href,
      languages: { ar: consultation.href, "x-default": consultation.href },
    },
    openGraph: {
      ...baseOpenGraph,
      url: consultation.href,
      title: consultation.title,
      description,
      ...(consultation.image ? { images: [{ url: consultation.image, alt: consultation.title }] } : {}),
    },
    twitter: {
      // The artwork is square: the small card shows it whole, the large one would crop it.
      card: "summary",
      title: consultation.title,
      description,
      ...(consultation.image ? { images: [consultation.image] } : {}),
    },
  };
}
