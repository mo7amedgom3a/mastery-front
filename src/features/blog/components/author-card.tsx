import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import type { BlogAuthorVM } from "../model/types";

/** The author's card under the article: portrait, name, bio and the way to their full profile. */
export function AuthorCard({ author }: { author: BlogAuthorVM }) {
  return (
    <section className="author-card" aria-labelledby="blog-author-name">
      <div className="flex flex-wrap items-start gap-5">
        <span className="avatar h-[76px] w-[76px] text-[34px]" aria-hidden="true">
          {author.avatar ? (
            // Blog assets and avatars are remote/presigned: keep the plain img, no optimizer.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={author.avatar} alt="" loading="lazy" decoding="async" />
          ) : (
            author.initial
          )}
        </span>

        <div className="min-w-52 flex-1">
          <h3 id="blog-author-name" className="type-h2 m-0">
            {author.name}
          </h3>
          <p className="type-caption-13 mt-1" style={{ color: "var(--muted)" }}>
            كاتب في مدونة ماستري
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link className="btn btn-ghost btn-sm" href={author.expertHref}>
            برامجه التدريبية
          </Link>
          <Link className="btn btn-ink btn-sm" href={author.href}>
            الملف الكامل
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {author.bio ? (
        <p className="bio">{author.bio}</p>
      ) : null}
    </section>
  );
}
