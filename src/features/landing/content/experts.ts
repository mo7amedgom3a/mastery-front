import type { BrandColor } from "@/components/ui/brand-colors";

export type Expert = {
  id: string;
  name: string;
  field: string;
  image: string;
  color: BrandColor;
};

/** Curated line-up from landing_page_assessts.txt (the API has no "featured experts" list yet). */
export const experts: readonly Expert[] = [
  {
    id: "thabet-hegazy",
    name: "د. ثابت حجازي",
    field: "خبير التسويق وتنمية المبيعات",
    image: "https://live.emasteryacademy.com/uploads/9dd4f2e5-a520-4adc-ac4b-66b6c008db07.png",
    color: "coral",
  },
  {
    id: "sahl-mahdi",
    name: "د. سهل مهدي",
    field: "خبير التسويق الإلكتروني",
    image: "https://live.emasteryacademy.com/uploads/8ea140f3-589b-40c4-a7b3-2360adbbe14c.png",
    color: "yellow",
  },
  {
    id: "huthaifa-hegazy",
    name: "حذيفة حجازي",
    field: "فنان تشكيلي",
    image: "https://live.emasteryacademy.com/uploads/bea43b9b-c67c-41a2-a60c-d8cef3375c19.jpeg",
    color: "sky",
  },
  {
    id: "nashmi-alharbi",
    name: "نشمي الحربي",
    field: "خبير الإمداد والمشتريات",
    image: "https://live.emasteryacademy.com/uploads/d9d66bac-3c0c-4086-b742-9b2c538148c0.png",
    color: "green",
  },
  {
    id: "fatima-belhaddad",
    name: "فاطمة بالحداد",
    field: "خبيرة تصميم الأزياء",
    image: "https://live.emasteryacademy.com/uploads/13ee2ffa-f0e8-4f5b-9d9e-44aaf4279f04.png",
    color: "lilac",
  },
  {
    id: "marwa-alsharaa",
    name: "مروة الشرع",
    field: "خبيرة التصوير الفوتوغرافي",
    image: "https://live.emasteryacademy.com/uploads/c706fa3d-21b0-4cbb-89fc-b3c4c77f72de.png",
    color: "teal",
  },
  {
    id: "mazhar-kantakji",
    name: "مظهر قنطقجي",
    field: "خبير المالية والمحاسبة",
    image: "https://live.emasteryacademy.com/uploads/f76209e6-e5b1-45f3-91e5-096c414c082a.png",
    color: "purple",
  },
  {
    id: "ahmed-aljarhi",
    name: "أحمد الجارحي",
    field: "خبير التنمية والتطوير",
    image: "https://live.emasteryacademy.com/uploads/141fceac-73be-44f9-9641-5ac151dd4ea5.png",
    color: "pink",
  },
  {
    id: "mohammed-alzubaidi",
    name: "محمد الزبيدي",
    field: "متخصص تحسين الجودة",
    image: "https://live.emasteryacademy.com/uploads/f0b31ae2-fc5e-4421-9635-48c9b12fec8c.png",
    color: "cream",
  },
];
