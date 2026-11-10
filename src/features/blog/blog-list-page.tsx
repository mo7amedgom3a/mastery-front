import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { RevealObserver } from "./components/reveal";
import { SubscribeBox } from "./components/subscribe-box";
import { TagPills } from "./components/tag-pills";
import { routes } from "@/config/routes";
import { blogListHref } from "./model/links";
import { formatArabicNumber } from "./model/mappers";
import type { BlogCardVM, BlogListData } from "./model/types";
import { BlogIndexJsonLd } from "./seo/list-json-ld";

function metaLine(post: BlogCardVM): string {
  const reading = `${formatArabicNumber(post.readingMinutes)} دقائق`;
  return [post.date, reading].filter(Boolean).join(" · ");
}

function AuthorMark({ post, small = false }: { post: BlogCardVM; small?: boolean }) {
  if (!post.author) return null;
  const size = small ? "h-9 w-9 text-[15px]" : "h-10 w-10 text-[17px]";
  return (
    <span className="flex min-w-0 items-center gap-3">
      <span className={`avatar ${size}`} aria-hidden="true">
        {post.author.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote portrait
          <img src={post.author.avatar} alt="" loading="lazy" decoding="async" />
        ) : (
          post.author.initial
        )}
      </span>
      <span className="min-w-0">
        <span className="type-caption block truncate" style={{ color: "var(--fg)" }}>
          {post.author.name}
        </span>
        {small ? null : (
          <span className="type-caption-12-400 block" style={{ color: "var(--muted)" }}>
            كاتب في مدونة ماستري
          </span>
        )}
      </span>
    </span>
  );
}

function FeaturedPost({ post }: { post: BlogCardVM }) {
  return (
    <article className="featured">
      <Link href={post.href} className="cover block" aria-label={post.title} tabIndex={-1}>
        {post.cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- blog asset URLs are presigned redirects
          <img src={post.cover} alt={post.coverAlt} loading="eager" decoding="async" {...{ fetchpriority: "high" }} />
        ) : null}
      </Link>

      <div data-reveal>
        <TagPills
          items={post.categories.map((category) => ({ label: category.name, href: category.href }))}
          label="تصنيفات المقال"
        />
        <Link href={post.href} className="featured-title">
          {post.title}
        </Link>
        {post.summary ? <p className="featured-summary">{post.summary}</p> : null}
        <div className="featured-meta">
          <AuthorMark post={post} />
          <span className="type-caption-13" style={{ color: "var(--muted)" }}>
            {metaLine(post)}
          </span>
          <Link href={post.href} className="btn btn-ghost btn-sm ms-auto">
            اقرأ المقال
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function PostCard({ post, index }: { post: BlogCardVM; index: number }) {
  return (
    <article data-reveal style={{ ["--d" as string]: `${Math.min(index, 6) * 0.05}s` }}>
      <Link href={post.href} className="post-card">
        <span className="cover block">
          {post.cover ? (
            // eslint-disable-next-line @next/next/no-img-element -- blog asset URLs are presigned redirects
            <img src={post.cover} alt={post.coverAlt} loading="lazy" decoding="async" />
          ) : null}
        </span>
        <span className="t">{post.title}</span>
        {post.summary ? (
          <span className="mt-2 line-clamp-2" style={{ color: "var(--muted)", fontSize: "var(--text-14)", lineHeight: 1.7 }}>
            {post.summary}
          </span>
        ) : null}
        <span className="m">{metaLine(post)}</span>
      </Link>
    </article>
  );
}

function Pagination({ data }: { data: BlogListData }) {
  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  return (
    <nav className="pagination" aria-label="صفحات المدونة">
      {data.page > 1 ? (
        <Link
          href={blogListHref({ page: data.page - 1, category: data.category })}
          className="page-link"
          aria-label="الصفحة السابقة"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : null}
      {pages.map((page) => (
        <Link
          key={page}
          href={blogListHref({ page, category: data.category })}
          className="page-link"
          aria-current={page === data.page ? "page" : undefined}
        >
          {formatArabicNumber(page)}
        </Link>
      ))}
      {data.page < totalPages ? (
        <Link
          href={blogListHref({ page: data.page + 1, category: data.category })}
          className="page-link"
          aria-label="الصفحة التالية"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : null}
    </nav>
  );
}

/**
 * The blog index: hero → category filter → featured post → the grid → pagination → newsletter.
 * The featured post is only the newest item on page 1; later pages are all grid.
 */
export function BlogListPage({ data }: { data: BlogListData }) {
  const featured = data.page === 1 ? data.posts[0] : undefined;
  const rest = featured ? data.posts.slice(1) : data.posts;

  return (
    <>
      <RevealObserver />

      <main id="main" className="blog-main">
        <section className="wrap blog-hero" id="about">
          <p className="eyebrow">مدونة ماستري</p>
          <h1 className="type-h1">مدونة ماستري</h1>
          <p className="type-subheading" style={{ color: "var(--muted)" }}>
            مقالات من خبراء ماستري في التسويق الرقمي والقيادة وريادة الأعمال — بلا ضجيج، وبعمق
            يليق بوقتك.
          </p>
          <p className="type-body mt-4 max-w-[64ch]" style={{ color: "var(--muted)" }}>
            يكتب هنا خبراء يمارسون ما يكتبون عنه. تعرّف على{" "}
            <Link href={routes.blogAuthors} className="underline underline-offset-4">
              كتّاب المدونة
            </Link>{" "}
            ومسيرتهم، أو تابع{" "}
            <Link href={routes.live} className="underline underline-offset-4">
              دورات البث المباشر
            </Link>{" "}
            للقاء الخبراء مباشرةً.
          </p>
        </section>

        <section className="wrap" id="categories" aria-labelledby="blog-categories-title">
          <h2 id="blog-categories-title" className="sr-only">
            تصنيفات المدونة
          </h2>
          <ul className="category-row">
            <li>
              <Link className="pill" href={blogListHref()} data-active={data.category === null}>
                الكل
              </Link>
            </li>
            {data.categories.map((category) => (
              <li key={category.slug}>
                <Link
                  className="pill"
                  href={category.href}
                  data-active={data.category === category.slug}
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="wrap" aria-label="المقالات">
          {featured ? <FeaturedPost post={featured} /> : null}

          {rest.length > 0 ? (
            <div className="post-grid">
              {rest.map((post, index) => (
                <PostCard key={post.slug} post={post} index={index} />
              ))}
            </div>
          ) : null}

          {data.posts.length === 0 ? (
            <p className="empty-state">
              لا توجد مقالات منشورة هنا بعد. جرّب تصنيفًا آخر أو عُد قريبًا.
            </p>
          ) : null}

          <Pagination data={data} />
        </section>

        <section className="wrap pb-20 pt-8" aria-label="الاشتراك في النشرة البريدية">
          <SubscribeBox />
        </section>
      </main>
      <BlogIndexJsonLd posts={data.posts} />
    </>
  );
}
