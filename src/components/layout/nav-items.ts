import {
  BadgeCheck,
  GraduationCap,
  LifeBuoy,
  type LucideIcon,
  Megaphone,
  Newspaper,
  PenLine,
  Radio,
  Users,
} from "lucide-react";
import type { Route } from "next";

import { routes } from "@/config/routes";

export type NavLink = {
  label: string;
  href: Route;
  description?: string;
  icon?: LucideIcon;
};

export type NavColumn = {
  title: string;
  links: readonly NavLink[];
};

/**
 * One header item. `catalog` builds its panel from the catalog menu data; `panel` is static.
 * Desktop and the drawer both render this list, so a new item is one entry here.
 */
export type NavEntry =
  | { kind: "link"; label: string; href: Route }
  | { kind: "catalog"; id: string; label: string; paths: readonly string[] }
  | { kind: "panel"; id: string; label: string; columns: readonly NavColumn[] };

export const navEntries: readonly NavEntry[] = [
  {
    kind: "catalog",
    id: "solutions",
    label: "الحلول",
    paths: ["/search", "/courses", "/diplomas", "/packages", "/bundles", "/consultations"],
  },
  {
    kind: "panel",
    id: "resources",
    label: "المصادر",
    columns: [
      {
        title: "أدوات وخدمات",
        links: [
          {
            label: "التحقق من الشهادات",
            href: routes.verify,
            description: "تأكد من صحة أي شهادة صادرة عن ماستري",
            icon: BadgeCheck,
          },
          {
            label: "الدعم والمساعدة",
            href: routes.studentSupport,
            description: "تواصل مع فريق الدعم وتابع طلباتك",
            icon: LifeBuoy,
          },
        ],
      },
      {
        title: "انضم إلينا",
        links: [
          {
            label: "انضم كمدرب",
            href: routes.trainers,
            description: "شارك خبرتك مع آلاف المتعلمين",
            icon: GraduationCap,
          },
          {
            label: "التسويق بالعمولة",
            href: routes.marketers,
            description: "اربح عمولة على كل عملية بيع",
            icon: Megaphone,
          },
        ],
      },
    ],
  },
  {
    kind: "panel",
    id: "knowledge",
    label: "المعرفة",
    columns: [
      {
        title: "اقرأ",
        links: [
          {
            label: "المدونة",
            href: routes.blog,
            description: "مقالات عملية في الأعمال والمهارات",
            icon: Newspaper,
          },
          {
            label: "كتّاب وخبراء المدونة",
            href: routes.blogAuthors,
            description: "تعرّف على من يكتب في مدونة ماستري",
            icon: PenLine,
          },
        ],
      },
      {
        title: "تعلّم من الخبراء",
        links: [
          {
            label: "البث المباشر وورش العمل",
            href: routes.live,
            description: "جلسات تدريبية مباشرة مع المدربين",
            icon: Radio,
          },
          {
            label: "المدربون والخبراء",
            href: routes.experts,
            description: "ابحث عن خبير حسب الاسم أو المجال",
            icon: Users,
          },
        ],
      },
    ],
  },
  { kind: "link", label: "حلول الشركات", href: routes.business },
  { kind: "link", label: "الاشتراكات", href: routes.subscriptions },
];

/** The drawer has room for a search entry; the desktop bar shows it as an icon instead. */
export const mobileSearchLink = { label: "البحث", href: routes.search } as const;

function isOnPath(pathname: string, path: string): boolean {
  return pathname === path || pathname.startsWith(`${path}/`);
}

/** Whether the current page belongs to this header item, for its active state. */
export function isNavEntryActive(entry: NavEntry, pathname: string): boolean {
  switch (entry.kind) {
    case "link":
      return isOnPath(pathname, entry.href);
    case "catalog":
      return entry.paths.some((path) => isOnPath(pathname, path));
    case "panel":
      return entry.columns.some((column) => column.links.some((link) => isOnPath(pathname, link.href)));
  }
}
