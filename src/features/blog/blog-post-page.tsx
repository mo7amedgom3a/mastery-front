import { CalendarDays, Clock3, Eye, Plus } from "lucide-react";
import Link from "next/link";

import { ArticleActions } from "./components/article-actions";
import { ArticleBlocks } from "./components/article-blocks";
import { AuthorCard } from "./components/author-card";
import { ReadNext } from "./components/read-next";
import { RevealObserver } from "./components/reveal";
import { SubscribeBox } from "./components/subscribe-box";
import { TagPills } from "./components/tag-pills";
import { Toc } from "./components/toc";
import { collectToc } from "./model/blocks";
import { formatArabicNumber } from "./model/mappers";
import type { BlogPostVM } from "./model/types";
import { BlogJsonLd } from "./seo/json-ld";

/**
 * One blog post in the paper/cinema theme: header → article header → cover → TOC → body → tags →
 * author card → read next → subscribe. `preview` drops the header/footer for the Studio iframe.
 */
export function BlogPostPage({ post, preview = false }: { post: BlogPostVM; preview?: boolean }) {
  // An explicit المحتويات block owns the contents; otherwise they are derived from the headings.
  const hasContentsBlock = post.document.blocks.some((block) => block.type === "toc");
  const toc = hasContentsBlock ? [] : collectToc(post.document.blocks);
  const categories = post.categories.map((category) => ({ label: category.name, href: category.href }));
  const tags = post.bodyTags.map((tag) => ({ label: tag }));

  return (
    <>
      <RevealObserver />
      <main id="main" className="blog-main">
        <article>
          <header className="article-head">
            <div className="wrap-read">
              <TagPills items={categories} label="تصنيفات المقال" reveal />
              <h1 className="type-h1" data-reveal style={{ ["--d" as string]: "0.06s" }}>
                {post.title}
              </h1>
              {post.summary ? (
                <p
                  className="type-subheading article-summary"
                  data-reveal
                  style={{ ["--d" as string]: "0.12s" }}
                >
                  {post.summary}
                </p>
              ) : null}

              {post.author ? (
                <div
                  className="author-row"
                  data-reveal
                  style={{ ["--d" as string]: "0.18s" }}
                >
                  <span className="avatar h-11 w-11 text-[19px]" aria-hidden="true">
                    {post.author.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element -- remote portrait
                      <img src={post.author.avatar} alt="" loading="lazy" decoding="async" />
                    ) : (
                      post.author.initial
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="type-h3 m-0">{post.author.name}</p>
                    <p className="type-caption-12-400" style={{ color: "var(--muted)" }}>
                      كاتب في مدونة ماستري
                    </p>
                  </div>
                  <Link className="btn btn-ink btn-sm hidden sm:inline-flex" href={post.author.href}>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    متابعة
                  </Link>
                </div>
              ) : null}

              <div className="meta-bar" data-reveal style={{ ["--d" as string]: "0.22s" }}>
                {post.date ? (
                  <span className="meta-item">
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                    <time dateTime={post.publishedAt ?? undefined}>{post.date}</time>
                  </span>
                ) : null}
                <span className="meta-item">
                  <Clock3 className="h-4 w-4" aria-hidden="true" />
                  {formatArabicNumber(post.readingMinutes)} دقائق قراءة
                </span>
                {post.views > 0 ? (
                  <span className="meta-item">
                    <Eye className="h-4 w-4" aria-hidden="true" />
                    {formatArabicNumber(post.views)} مشاهدة
                  </span>
                ) : null}
                <div className="ms-auto">
                  <ArticleActions title={post.title} />
                </div>
              </div>

              {post.cover ? (
                <figure className="cover article-cover" data-reveal style={{ ["--d" as string]: "0.1s" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- blog asset URLs are presigned redirects */}
                  <img src={post.cover} alt={post.coverAlt} loading="eager" decoding="async" />
                </figure>
              ) : null}
            </div>
          </header>

          <div className="wrap-read pb-4 pt-8">
            <Toc entries={toc} />
            <ArticleBlocks blocks={post.document.blocks} />

            <div className="dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>

            <TagPills items={tags} label="وسوم المقال" />
          </div>
        </article>

        {post.author ? (
          <section className="scroll-mt-24 pt-10" aria-label="عن الكاتب">
            <div className="wrap-read">
              <p className="eyebrow">عن الكاتب</p>
              <div className="mt-5" data-reveal>
                <AuthorCard author={post.author} />
              </div>
            </div>
          </section>
        ) : null}

        <section className="pt-14" aria-label="مقالات أخرى">
          <div className="wrap-read">
            <ReadNext posts={post.related} />
          </div>
        </section>

        <section className="pb-20 pt-12" aria-label="الاشتراك في النشرة البريدية">
          <div className="wrap-read">
            <SubscribeBox source="blog-post" />
          </div>
        </section>

        {preview ? null : <BlogJsonLd post={post} />}
      </main>
    </>
  );
}
