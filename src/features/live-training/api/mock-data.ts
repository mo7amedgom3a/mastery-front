import type { LiveTrainingDto } from "../model/types";

/**
 * MOCK: live trainings until the backend has an endpoint for them. Transcribed from the Sales
 * Mastery (cohort 7) page on live.emasteryacademy.com. `get-live-trainings.ts` is the only reader,
 * so this file and that one are all that change when the real API ships.
 *
 * TODO(api): replace with the backend's live-trainings list; keep the `LiveTrainingDto` shape or
 * map to it there.
 */
export const LIVE_TRAININGS: readonly LiveTrainingDto[] = [
  {
    id: 1,
    slug: "sales-mastery-professional-7",
    title: "إتقان المبيعات",
    title_en: "Sales Mastery Professional",
    subtitle: "البيع ليس جودة الكلام بل فن التأثير والتفاوض والإقناع، لذا في المبيعات لا نتعلم الكلام بل المهارات.",
    summary:
      "دورة احترافية مكثفة على مدار 5 أيام، تحوّل مهاراتك البيعية من العمل العشوائي إلى منظومة احترافية تعتمد على عقلية النجاح، خطوات بيع منظمة، ومهارات إقناع وإغلاق متقدمة.",
    cohort_label: "الدفعة 7",
    cover_image: "https://live.emasteryacademy.com/uploads/731f8b00-b0d9-4e8a-9526-5c7002b40a1c.png",
    hero_image: "https://live.emasteryacademy.com/assets/smp-hero-trainer-DWJ1gM6M.webp",
    trainer: {
      name: "د. ثابت حجازي",
      title: "خبير التسويق وتنمية المبيعات",
      image: "https://live.emasteryacademy.com/assets/smp-hero-trainer-DWJ1gM6M.webp",
    },
    starts_at: "2026-10-05T19:30:00+03:00",
    ends_at: "2026-10-10T22:00:00+03:00",
    sessions_count: 5,
    session_start: "19:30",
    session_end: "22:00",
    timezone: "Asia/Riyadh",
    timezone_label: "بتوقيت مكة",
    location: "أونلاين (بث مباشر)",
    certificate: "شهادة دولية معتمدة من CPD UK (مطبوعة)",
    price: { usd: 520, sar: 1950 },
    intro_video_youtube_id: "wHzUvZ57Ku8",
    brochure_url: "https://drive.google.com/file/d/1nBhdhcIHOCkPBGLptKIOInJCpg527wnE/view?usp=sharing",
    enroll_url: "https://live.emasteryacademy.com/",
    highlights: ["بث مباشر تفاعلي", "متاح لـ12 شهر", "شهادتان معتمدتان", "ساعة أسئلة بعد كل جلسة"],
  },
];
