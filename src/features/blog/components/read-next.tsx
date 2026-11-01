import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { formatArabicNumber } from "../model/mappers";
import type { BlogCardVM } from "../model/types";

/** «اقرأ التالي»: related posts as the demo's index rows. */
export function ReadNext({ posts }: { posts: BlogCardVM[] }) {
  if (posts.length === 0) return null;
  return (
    <section aria-label="مقالات أخرى">
      <p className="eyebrow">اقرأ التالي</p>
      <div className="mt-4">
        {posts.map((post, index) => (
          <Link
            key={post.slug}
            href={post.href}
            className="index-row"
            data-reveal
            style={{ ["--d" as string]: `${index * 0.08}s` }}
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
    </section>
  );
}
