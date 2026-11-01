import { ArrowLeft, PenLine } from "lucide-react";
import Link from "next/link";

import { formatArabicNumber } from "../model/mappers";
import type { BlogCardVM } from "../model/types";

/** «مقالات الكاتب»: the author's published posts as the demo's index rows. */
export function AuthorArticles({ posts, authorName }: { posts: BlogCardVM[]; authorName: string }) {
  return (
    <section id="articles" aria-labelledby="author-articles-title" className="scroll-mt-24">
      <p className="eyebrow">من قلمه</p>
      <h2 id="author-articles-title" className="type-h2 mt-2">
        مقالات {authorName}
      </h2>

      {posts.length === 0 ? (
        <p className="type-body mt-4" style={{ color: "var(--muted)" }}>
          لم يُنشر له مقال بعد — اشترك في النشرة ليصلك أول ما ينشر.
        </p>
      ) : (
        <div className="mt-6">
          {posts.map((post, index) => (
            <Link
              key={post.slug}
              href={post.href}
              className="index-row"
              data-reveal
              style={{ ["--d" as string]: `${index * 0.06}s` }}
            >
              {post.cover ? (
                // eslint-disable-next-line @next/next/no-img-element -- blog asset URLs are presigned redirects
                <img
                  src={post.cover}
                  alt=""
                  width={72}
                  height={72}
                  loading="lazy"
                  decoding="async"
                  className="index-thumb"
                  aria-hidden="true"
                />
              ) : (
                <span className="index-thumb" aria-hidden="true" />
              )}
              <span className="min-w-0 flex-1">
                <span className="t block">{post.title}</span>
                <span className="m block">
                  {[post.date, `${formatArabicNumber(post.readingMinutes)} دقائق`].filter(Boolean).join(" · ")}
                </span>
              </span>
              <span className="index-arrow" aria-hidden="true">
                <ArrowLeft className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      )}

      <p className="type-caption-13 mt-5 flex items-center gap-2" style={{ color: "var(--muted)" }}>
        <PenLine aria-hidden="true" className="size-4" />
        تُنشر مقالاته في مدونة ماستري، وتصلك الجديدة منها بالاشتراك في النشرة.
      </p>
    </section>
  );
}
