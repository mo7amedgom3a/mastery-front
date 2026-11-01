import { Award, BookOpen, Globe2, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { routes } from "@/config/routes";
import { SocialIcon, socialLabel, type SocialNetwork } from "@/components/icons/social-icons";

import type { AuthorExpertFacts } from "../api/get-blog-author-page";
import type { AuthorProfile } from "../data/author-profiles";
import { formatArabicNumber } from "../model/mappers";
import { SpotParallax } from "./spot-parallax";

function programFact(profile: AuthorProfile, expert: AuthorExpertFacts | null): string {
  if (!expert) return profile.stats[3] ? `${profile.stats[3].value} برنامجًا تدريبيًا` : "برامج تدريبية معتمدة";
  const parts: string[] = [];
  if (expert.courseCount) parts.push(`${formatArabicNumber(expert.courseCount)} دورة`);
  if (expert.diplomaCount) parts.push(`${formatArabicNumber(expert.diplomaCount)} دبلوم`);
  if (expert.packageCount) parts.push(`${formatArabicNumber(expert.packageCount)} حزمة`);
  return parts.length > 0 ? `${parts.join(" · ")} في ماستري` : profile.title;
}

/**
 * The cinematic band at the top of a curated author profile (MasterClass-style, after the
 * live-training spotlight): a black stage, the author's cutout standing on a solid brand field,
 * poster-scale name, and the programme name set huge as a watermark behind the portrait.
 * Forced dark in both blog themes; the rest of the page follows the reader's paper/cinema choice.
 */
export function AuthorSpotlight({
  profile,
  expert,
}: {
  profile: AuthorProfile;
  expert: AuthorExpertFacts | null;
}) {
  const socials = [
    { href: expert?.facebook, network: "facebook" as SocialNetwork },
    { href: expert?.instagram, network: "instagram" as SocialNetwork },
    { href: expert?.youtube, network: "youtube" as SocialNetwork },
  ].filter((item): item is { href: string; network: SocialNetwork } => Boolean(item.href));

  const facts = [
    { Icon: BookOpen, label: programFact(profile, expert) },
    { Icon: Users, label: `${profile.stats[1].value} ${profile.stats[1].label}` },
    { Icon: Award, label: profile.stats[2] ? `${profile.stats[2].value} · ${profile.stats[2].label}` : profile.title },
    { Icon: Globe2, label: profile.focus.slice(0, 2).join(" · ") },
  ];

  return (
    <section
      className="spot"
      data-field={profile.portrait.field}
      aria-labelledby="author-name"
    >
      <div className="wrap spot-grid">
        <div className="spot-copy">
          <span className="spot-eyebrow">
            <span className="spot-dot" aria-hidden="true" />
            خبير مدونة ماستري
          </span>

          <h1 id="author-name" className="spot-name" data-reveal>
            {profile.name}
          </h1>
          <p className="spot-name-en" dir="ltr" lang="en" data-reveal style={{ ["--d" as string]: "0.06s" }}>
            {profile.englishName}
          </p>
          <p className="spot-title" data-reveal style={{ ["--d" as string]: "0.1s" }}>
            {profile.title}
          </p>
          <p className="spot-lead" data-reveal style={{ ["--d" as string]: "0.14s" }}>
            {profile.tagline}
          </p>

          <ul className="spot-facts" data-reveal style={{ ["--d" as string]: "0.18s" }}>
            {facts.map(({ Icon, label }) => (
              <li key={label}>
                <Icon aria-hidden="true" className="size-4" />
                <span>{label}</span>
              </li>
            ))}
          </ul>

          <div className="spot-actions" data-reveal style={{ ["--d" as string]: "0.22s" }}>
            <a href="#articles" className="btn btn-accent">
              اقرأ مقالاته
            </a>
            <Link href={routes.expert(profile.key, profile.name)} className="btn btn-ghost">
              الملف التدريبي الكامل
            </Link>
            {socials.length > 0 ? (
              <span className="spot-social">
                {socials.map(({ href, network }) => (
                  <a key={network} href={href} target="_blank" rel="noreferrer" aria-label={socialLabel[network]} className="icon-btn">
                    <SocialIcon network={network} className="size-4" />
                  </a>
                ))}
              </span>
            ) : null}
          </div>
        </div>

        <SpotParallax />

        <div className="spot-stage">
          <span className="spot-watermark" dir="ltr" lang="en" aria-hidden="true">
            {profile.englishName}
          </span>
          <div className="spot-frame" aria-hidden="true" />
          <div className="spot-field" aria-hidden="true" />
          <Image
            src={profile.portrait.src}
            alt={profile.portrait.alt}
            fill
            priority
            sizes="(min-width: 1024px) 420px, (min-width: 640px) 320px, 70vw"
            className="spot-portrait"
          />
        </div>
      </div>
    </section>
  );
}
