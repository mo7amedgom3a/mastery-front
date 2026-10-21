import type { BrandColor } from "@/components/ui/brand-colors";

export type ExpertVideo = {
  /** YouTube video id: drives the thumbnail, the embed and the watch link. */
  youtubeId: string;
  title: string;
  /** Show or channel the interview aired on. */
  show: string;
  /** Who appears in the episode, as shown under the stage. */
  host: string;
  role: string;
  category: string;
  duration: string;
  /** View and like counts as YouTube showed them when the list was curated (static snapshot). */
  views: string;
  likes: string;
  color: BrandColor;
};

/** Curated media appearances of Mastery experts (from spotlight-cards.html; no API for this yet). */
export const expertVideos: readonly ExpertVideo[] = [
  {
    youtubeId: "99Jk4iUu7bo",
    title: "من موظف خدمة عملاء إلى بناء شركات بملايين الريالات",
    show: "بودكاست بترولي",
    host: "د. سهل مهدي",
    role: "مؤسس ماستري أكاديمي",
    category: "ريادة أعمال",
    duration: "1:28:36",
    views: "118,994",
    likes: "1,269",
    color: "purple",
  },
  {
    youtubeId: "2PgzVCmyGZM",
    title: "بدون مجاملات!! جلسة استشارية مع د.ثابت حجازي و د. سهل مهدي",
    show: "جلسة استشارية",
    host: "د. ثابت حجازي · د. سهل مهدي",
    role: "خبراء التسويق والقيادة",
    category: "تسويق",
    duration: "1:21:10",
    views: "5,120",
    likes: "211",
    color: "yellow",
  },
  {
    youtubeId: "J-xdKvfsQaY",
    title: "موظفك جسد بلا روح ، ظاهرة الانفصال الوظيفي",
    show: "ثابت حجازي",
    host: "ثابت حجازي",
    role: "خبير القيادة والإدارة",
    category: "موارد بشرية",
    duration: "28:55",
    views: "8,819",
    likes: "384",
    color: "teal",
  },
  {
    youtubeId: "yrT3DcZAfhw",
    title: "الدروس اللي ما تتعلمها في المدرسة ولا الجامعة",
    show: "بودكاست على البنش",
    host: "سهل المهدي",
    role: "ضيف بودكاست على البنش",
    category: "تطوير ذات",
    duration: "1:08:09",
    views: "16,208",
    likes: "343",
    color: "coral",
  },
];
