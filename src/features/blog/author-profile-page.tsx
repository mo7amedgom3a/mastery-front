import { ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";

import { routes } from "@/config/routes";

import type { BlogAuthorPageData } from "./api/get-blog-author-page";
import { AuthorArticles } from "./components/author-articles";
import { AuthorSpotlight } from "./components/author-spotlight";
import { RevealObserver } from "./components/reveal";
import { AuthorJsonLd } from "./seo/author-json-ld";

/**
 * A curated author profile: the cinematic spotlight, the numbers, the story and milestones, the
 * credentials, what peers say, then the author's articles and a closing CTA. The paper/cinema
 * toggle governs everything except the spotlight band, which stays dark on purpose.
 */
export function AuthorProfilePage({ data }: { data: BlogAuthorPageData }) {
  const { profile, posts, expert } = data;

  return (
    <>
      <RevealObserver />
      <main id="main" className="blog-main">
        <article>
          <AuthorSpotlight profile={profile} expert={expert} />

          <section className="wrap spot-stats" aria-label={`أرقام ${profile.name}`}>
            {profile.stats.map((stat, index) => (
              <div key={stat.label} className="spot-stat" data-reveal style={{ ["--d" as string]: `${index * 0.06}s` }}>
                <span className="v" dir="ltr">
                  {stat.value}
                </span>
                <span className="l">{stat.label}</span>
              </div>
            ))}
          </section>

          <section className="wrap author-about" aria-labelledby="author-about-title">
            <div className="wrap-read">
              <p className="eyebrow" data-reveal>
                السيرة
              </p>
              <h2 id="author-about-title" className="type-h1 mt-3" data-reveal style={{ ["--d" as string]: "0.05s" }}>
                عن {profile.name}
              </h2>
              {profile.story.map((section, sectionIndex) => (
                <div key={section.title} className="author-story" data-reveal style={{ ["--d" as string]: `${0.08 + sectionIndex * 0.04}s` }}>
                  <h3 className="type-h2">{section.title}</h3>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph.slice(0, 40)} className="type-body">
                      {paragraph}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </section>

          {profile.milestones.length > 0 ? (
            <section className="wrap author-milestones" aria-labelledby="author-milestones-title">
              <p className="eyebrow" data-reveal>
                المسار
              </p>
              <h2 id="author-milestones-title" className="type-h2 mt-2" data-reveal>
                محطات صنعت التجربة
              </h2>
              <ol className="timeline">
                {profile.milestones.map((milestone, index) => (
                  <li key={`${milestone.year}-${milestone.title}`} data-reveal style={{ ["--d" as string]: `${index * 0.05}s` }}>
                    <span className="year">{milestone.year}</span>
                    <span className="body">
                      <strong>{milestone.title}</strong>
                      <span>{milestone.body}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          <section className="wrap author-detail-grid" aria-label="التخصص والمؤهلات">
            <div className="author-detail-card" data-reveal>
              <h3 className="type-h3">مجالات التخصص</h3>
              <div className="chips">
                {profile.focus.map((item) => (
                  <span key={item} className="pill">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="author-detail-card" data-reveal style={{ ["--d" as string]: "0.06s" }}>
              <h3 className="type-h3">المؤهلات والاعتمادات</h3>
              <ul className="check-list">
                {profile.credentials.map((item) => (
                  <li key={item}>
                    <CheckCircle2 aria-hidden="true" className="size-4" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="author-detail-card" data-reveal style={{ ["--d" as string]: "0.12s" }}>
              <h3 className="type-h3">جهات درّبها</h3>
              <ul className="check-list">
                {profile.trained.map((item) => (
                  <li key={item}>
                    <Sparkles aria-hidden="true" className="size-4" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {profile.testimonials.length > 0 ? (
            <section className="wrap author-testimonials" aria-labelledby="author-testimonials-title">
              <p className="eyebrow" data-reveal>
                كلمات من أصدقائه
              </p>
              <h2 id="author-testimonials-title" className="type-h2 mt-2" data-reveal>
                ماذا يقول من عمل معه؟
              </h2>
              <div className="quote-grid">
                {profile.testimonials.map((testimonial, index) => (
                  <figure key={testimonial.name} className="quote-card" data-reveal style={{ ["--d" as string]: `${index * 0.05}s` }}>
                    <blockquote>{testimonial.quote}</blockquote>
                    <figcaption>
                      <span className="name">{testimonial.name}</span>
                      <span className="role">{testimonial.role}</span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          ) : null}

          <section className="wrap author-articles-block">
            <AuthorArticles posts={posts} authorName={profile.name} />
          </section>

          <section className="wrap author-cta-wrap">
            <div className="cta-box author-cta" data-reveal>
              <div>
                <p className="eyebrow">من المدونة إلى التطبيق</p>
                <h2 className="type-h2 mt-2">تعلّم مع {profile.name} في ماستري أكاديمي</h2>
                <p className="type-body mt-3">
                  برامج مصممة على يد خبراء السوق، مع شهادات معتمدة ومجتمع من رواد الأعمال والمحترفين.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href={routes.expert(profile.key, profile.name)} className="btn btn-ink">
                  استعرض برامجه
                  <ArrowLeft aria-hidden="true" className="size-4" />
                </Link>
                <Link href={`${routes.blog}#subscribe`} className="btn btn-accent">
                  اشترك في النشرة
                </Link>
              </div>
            </div>
          </section>
        </article>
      </main>

      <AuthorJsonLd profile={profile} expert={expert} posts={posts} />
    </>
  );
}
