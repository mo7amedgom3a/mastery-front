export type Partner = {
  id: string;
  name: string;
  /** Logo under /public/partners, with its intrinsic size for layout. */
  logo: string;
  width: number;
  height: number;
};

/** Companies whose teams trained with Mastery (b2b_success_compaines_parteners.txt). */
export const partners: readonly Partner[] = [
  { id: "bmw-saudi-arabia", name: "BMW السعودية", logo: "/partners/bmw-saudi-arabia.png", width: 256, height: 256 },
  { id: "saudi-german-health", name: "السعودي الألماني الصحية", logo: "/partners/saudi-german-health.svg", width: 191, height: 78 },
  { id: "juhayna", name: "جهينة", logo: "/partners/juhayna.png", width: 122, height: 30 },
  { id: "tabuk-pharmaceuticals", name: "تبوك للأدوية", logo: "/partners/tabuk-pharmaceuticals.png", width: 474, height: 123 },
  { id: "arabian-oud", name: "العربية للعود", logo: "/partners/arabian-oud.png", width: 400, height: 100 },
  { id: "lemon", name: "ليمون", logo: "/partners/lemon.png", width: 480, height: 337 },
  { id: "ultimate-solutions", name: "الحلول المتكاملة Ultimate Solutions", logo: "/partners/ultimate-solutions.svg", width: 520, height: 170 },
];
