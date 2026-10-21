import Link from "next/link";
import type { ComponentProps } from "react";

type AppLinkProps = ComponentProps<typeof Link>;

/**
 * `next/link` with viewport prefetching off by default. Most destinations linked from the landing
 * page are not built yet; prefetching them would only fetch 404s on every visit. Opt back in per
 * link with `prefetch` once the target page ships.
 */
export function AppLink({ prefetch = false, ...props }: AppLinkProps) {
  return <Link prefetch={prefetch} {...props} />;
}

type MaybeLinkProps = Omit<AppLinkProps, "href"> & { href: AppLinkProps["href"] | null };

/** An `AppLink` when there is somewhere to go; otherwise the same content in a plain `span`. */
export function MaybeLink({ href, children, className, title }: MaybeLinkProps) {
  return href ? (
    <AppLink href={href} className={className} title={title}>
      {children}
    </AppLink>
  ) : (
    <span className={className} title={title}>
      {children}
    </span>
  );
}
