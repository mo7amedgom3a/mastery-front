import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { routes } from "@/config/routes";

import type { AuthorProfile } from "./data/author-profiles";
import { RevealObserver } from "./components/reveal";
import { AuthorIndexJsonLd } from "./seo/list-json-ld";

/** «الخبراء»: the blog's curated authors, each opening their cinematic profile. */
export function AuthorIndexPage({ profiles }: { profiles: AuthorProfile[] }) {
  return (
    <>
      <RevealObserver />
      <main id="main" className="blog-main">
        <section className="wrap author-index-head">
          <p className="eyebrow" data-reveal>
            الخبراء
          </p>
          <h1 className="type-h1 mt-3" data-reveal style={{ ["--d" as string]: "0.05s" }}>
            من يكتب في مدونة ماستري؟
          </h1>
          <p className="type-subheading mt-4" data-reveal style={{ ["--d" as string]: "0.1s" }}>
            خبراء يمارسون ما يكتبون عنه: يبنون الشركات، ويقودون الفرق، ويدرّبون آلاف المتعلمين في العالم العربي.
          </p>
        </section>

        <section className="wrap author-index-grid" aria-label="قائمة الخبراء">
          {profiles.map((profile, index) => (
            <Link
              key={profile.slug}
              href={routes.blogAuthor(profile.slug)}
              className="author-card-lg"
              data-field={profile.portrait.field}
              data-reveal
              style={{ ["--d" as string]: `${index * 0.08}s` }}
            >
              <span className="portrait">
                <Image
                  src={profile.portrait.src}
                  alt={profile.portrait.alt}
                  fill
                  sizes="(min-width: 900px) 300px, 60vw"
                  className="portrait-img"
                />
              </span>
              <span className="body">
                <span className="name">{profile.name}</span>
                <span className="en" dir="ltr" lang="en">
                  {profile.englishName}
                </span>
                <span className="title">{profile.title}</span>
                <span className="tagline">{profile.tagline}</span>
                <span className="stats">
                  {profile.stats.slice(0, 3).map((stat) => (
                    <span key={stat.label}>
                      <strong dir="ltr">{stat.value}</strong>
                      <small>{stat.label}</small>
                    </span>
                  ))}
                </span>
                <span className="more">
                  الملف الكامل
                  <ArrowLeft aria-hidden="true" className="size-4" />
                </span>
              </span>
            </Link>
          ))}
        </section>

        <section className="wrap author-index-foot" data-reveal>
          <div className="cta-box">
            <p className="eyebrow">المدونة</p>
            <h2 className="type-h2 mt-2">اقرأ أحدث ما كتبه خبراؤنا</h2>
            <p className="type-body mt-3">مقالات عملية في التسويق والقيادة وريادة الأعمال، بلا ضجيج وبعمق يناسب وقتك.</p>
            <Link href={routes.blog} className="btn btn-ink mt-5">
              تصفّح المقالات
              <ArrowLeft aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </section>
      </main>
      <AuthorIndexJsonLd profiles={profiles} />
    </>
  );
}
