import type { BrandColor } from "@/components/ui/brand-colors";

export type TestimonialVideo = {
  /** YouTube Shorts id: drives the portrait thumbnail, the embed and the watch link. */
  youtubeId: string;
  /** Card caption. Rewritten from the upload titles, which are mostly a registration call-to-action. */
  title: string;
  /** The diploma or course the learners talk about (the tag on the card). */
  program: string;
  /** Runtime as YouTube shows it (m:ss). */
  duration: string;
  color: BrandColor;
};

/** Learner feedback reels from the Mastery Academy YouTube channel (testimonal_short_videos.txt). */
export const testimonialVideos: readonly TestimonialVideo[] = [
  { youtubeId: "YWc3YMPV9mo", title: "«هذا الدبلوم غيّر حياتي تماماً»", program: "دبلوم التسويق المتكامل", duration: "1:00", color: "coral" },
  { youtubeId: "3_WR15Dg7qg", title: "آراء وتجارب المشتركين السابقين", program: "دورة الذكاء الاصطناعي", duration: "1:53", color: "purple" },
  { youtubeId: "pTXlpNCK_sk", title: "ماذا قالوا عن دورة إتقان المبيعات؟", program: "دورة إتقان المبيعات", duration: "2:09", color: "sky" },
  { youtubeId: "uwfLPv3wfGc", title: "كيف غيّر الدبلوم حياتهم المهنية؟", program: "تجارب الخريجين", duration: "1:39", color: "yellow" },
  { youtubeId: "tXSAJhEbJXU", title: "آراء خريجي دبلوم التسويق المتكامل", program: "دبلوم التسويق المتكامل", duration: "1:56", color: "green" },
  { youtubeId: "I7x8K94Hwj4", title: "ماذا قال مشتركو الدفعات السابقة؟", program: "دورة إتقان المبيعات", duration: "0:57", color: "teal" },
  { youtubeId: "uMra8qTz4dI", title: "تجارب مشتركينا بكلماتهم", program: "تجارب الخريجين", duration: "1:57", color: "lilac" },
];
