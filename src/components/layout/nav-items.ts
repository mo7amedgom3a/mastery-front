import {
  Award,
  BadgeCheck,
  Building2,
  ChartColumn,
  ClipboardCheck,
  GraduationCap,
  Headset,
  Layers,
  LayoutDashboard,
  Library,
  LifeBuoy,
  type LucideIcon,
  Megaphone,
  Newspaper,
  PenLine,
  PlayCircle,
  Radio,
  Route as RouteIcon,
  Sparkles,
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
  /** Muted line under the column title (mega-menu layout). */
  subtitle?: string;
  /** `list` renders icon rows with hairline dividers; `cards` (default) renders the compact cards. */
  variant?: "cards" | "list";
  links: readonly NavLink[];
};

/** The Jisr-style media column at the inline end of a mega menu: a highlight card plus link groups. */
export type NavFeaturePanel = {
  title: string;
  body?: string;
  stats?: readonly { value: string; label: string }[];
  primary?: NavLink;
  groups: readonly { title: string; links: readonly NavLink[] }[];
};

/**
 * One header item. `catalog` builds its panel from the catalog menu data; `panel` is static.
 * Desktop and the drawer both render this list, so a new item is one entry here.
 */
export type NavEntry =
  | { kind: "link"; label: string; href: Route }
  | { kind: "catalog"; id: string; label: string; paths: readonly string[] }
  | {
      kind: "panel";
      id: string;
      label: string;
      columns: readonly NavColumn[];
      feature?: NavFeaturePanel;
    };

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
  {
    kind: "panel",
    id: "business",
    label: "حلول الشركات",
    columns: [
      {
        title: "التدريب للشركات",
        subtitle: "مسارات ومحتوى بحسب احتياج فريقك",
        variant: "list",
        links: [
          {
            label: "مسارات تدريبية مخصّصة",
            href: routes.businessB2b,
            description: "نبني المسار من أهدافك وفجوات فريقك",
            icon: RouteIcon,
          },
          {
            label: "المكتبة التدريبية",
            href: routes.businessB2b,
            description: "195 برنامجاً في 13 مجالاً تدريبياً",
            icon: Library,
          },
          {
            label: "الدبلومات الاحترافية",
            href: routes.diplomas,
            description: "برامج متعددة الوحدات تنتهي بشهادة",
            icon: GraduationCap,
          },
          {
            label: "أكاديمية المبيعات",
            href: routes.businessSales,
            description: "تدريب متخصص لفرق البيع وخدمة العملاء",
            icon: ChartColumn,
          },
          {
            label: "برامج تأهيلية مخصّصة",
            href: routes.businessRequest(),
            description: "محتوى يعكس منتجات شركتك وسياساتها",
            icon: Sparkles,
          },
          {
            label: "بث مباشر وورش عمل",
            href: routes.live,
            description: "جلسات تفاعلية بحسب جدول فريقك",
            icon: Radio,
          },
        ],
      },
      {
        title: "المتابعة والاعتماد",
        subtitle: "قياس الأثر وتوثيق الإنجاز",
        variant: "list",
        links: [
          {
            label: "لوحة المتابعة والتقارير",
            href: routes.businessB2b,
            description: "تقدّم وإنجاز لكل موظف وقسم",
            icon: LayoutDashboard,
          },
          {
            label: "إدارة الأقسام والصلاحيات",
            href: routes.businessB2b,
            description: "أقسام ومشرفون وصلاحيات متابعة",
            icon: Users,
          },
          {
            label: "التقييمات والاختبارات",
            href: routes.businessB2b,
            description: "قياس الفهم بعد كل وحدة",
            icon: ClipboardCheck,
          },
          {
            label: "شهادات الإتمام",
            href: routes.businessB2b,
            description: "شهادة لكل موظف يُتم البرنامج",
            icon: Award,
          },
          {
            label: "استشارات الخبراء",
            href: routes.businessB2b,
            description: "جلسات مع خبراء ممارسين",
            icon: Headset,
          },
          {
            label: "باقات الشركات",
            href: routes.subscriptionsFor("company"),
            description: "اشتراك أونلاين أو عرض خاص للفرق الكبيرة",
            icon: Building2,
          },
        ],
      },
    ],
    feature: {
      title: "جاهز لتدريب فريقك؟",
      body: "أخبرنا عن احتياجك، ونبني عرضاً واضحاً للنطاق والخطوات.",
      stats: [
        { value: "195+", label: "برنامج تدريبي" },
        { value: "13", label: "مجالاً" },
        { value: "39", label: "شركة تثق بنا" },
      ],
      primary: {
        label: "اطلب عرضاً تدريبياً",
        href: routes.businessRequest(),
        icon: PlayCircle,
      },
      groups: [
        {
          title: "استكشف",
          links: [
            { label: "منصة ماستري للشركات", href: routes.businessB2b },
            { label: "قصص النجاح", href: routes.businessB2b },
            { label: "حلول الشركات", href: routes.business },
          ],
        },
      ],
    },
  },
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
