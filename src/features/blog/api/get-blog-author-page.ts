import "server-only";

import { getCatalogExpert } from "@/lib/api/browse";
import { cachedRead, valueOf } from "@/lib/api/server-cache";

import { authorProfiles, findAuthorProfile, type AuthorProfile } from "../data/author-profiles";
import { cardVM } from "../model/mappers";
import type { BlogCardVM } from "../model/types";
import { getBlogPosts } from "./get-blog-posts";

/** Keep in sync with the author page's `revalidate` and the post pages'. */
const AUTHOR_REVALIDATE_SECONDS = 300;

/** The live instructor facts the profile borrows from `/catalog/experts/{key}`. */
export type AuthorExpertFacts = {
  name: string;
  avatar: string | null;
  courseCount: number;
  diplomaCount: number;
  packageCount: number;
  consultationCount: number;
  facebook: string | null;
  instagram: string | null;
  youtube: string | null;
};

export type BlogAuthorPageData = {
  profile: AuthorProfile;
  posts: BlogCardVM[];
  total: number;
  expert: AuthorExpertFacts | null;
  /** True when the author has no curated profile and the generic expert page is the destination. */
  hasProfile: boolean;
};

export function listAuthorProfiles(): AuthorProfile[] {
  return authorProfiles;
}

type ExpertWire = {
  name?: string | null;
  avatar?: string | null;
  course_count?: number | null;
  diploma_count?: number | null;
  package_count?: number | null;
  consultation_count?: number | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  youtube_url?: string | null;
};

function expertFacts(expert: ExpertWire | null | undefined): AuthorExpertFacts | null {
  if (!expert) return null;
  return {
    name: expert.name?.trim() || "",
    avatar: expert.avatar?.trim() || null,
    courseCount: expert.course_count ?? 0,
    diplomaCount: expert.diploma_count ?? 0,
    packageCount: expert.package_count ?? 0,
    consultationCount: expert.consultation_count ?? 0,
    facebook: expert.facebook_url?.trim() || null,
    instagram: expert.instagram_url?.trim() || null,
    youtube: expert.youtube_url?.trim() || null,
  };
}

/**
 * One curated author profile: the editorial content, the author's published posts and the live
 * instructor facts. When the slug belongs to an author without a curated profile the caller falls
 * back to the expert page; `null` means the slug is unknown.
 */
export async function loadBlogAuthorPage(slug: string): Promise<BlogAuthorPageData | null> {
  const profile = findAuthorProfile(slug);
  if (!profile) return null;

  const [postsResult, expertResult] = await Promise.allSettled([
    getBlogPosts({ author: profile.key, pageSize: 24 }),
    getCatalogExpert(profile.key, cachedRead(AUTHOR_REVALIDATE_SECONDS, ["experts", `expert-${profile.key}`])),
  ]);
  const posts = valueOf(postsResult, `blog posts by ${profile.name}`);
  const expert = valueOf(expertResult, `expert ${profile.key}`);
  return {
    profile,
    posts: (posts?.items ?? []).map(cardVM),
    total: posts?.total ?? 0,
    expert: expertFacts(expert?.expert as ExpertWire | undefined),
    hasProfile: true,
  };
}
