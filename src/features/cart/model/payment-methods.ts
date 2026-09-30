import type { PaymentMethodId } from "@/lib/shop/contract";

export type PaymentMethodDef = {
  id: PaymentMethodId;
  label: string;
  description: string;
  /** Wordmarks shown beside the label. Text stand-ins until the official logo files are added. */
  marks: readonly string[];
  /** The provider the order is handed to. */
  provider: "stripe" | "tabby" | "tamara";
  /** Pay-later plans: the order is split into this many equal payments. */
  installments?: number;
  /** Order total range the provider accepts, in major units. */
  min?: number;
  max?: number;
  /** Only offered on devices that can use it (checked in the browser). */
  requires?: "apple_pay";
};

/**
 * The payment methods the academy supports. Eligibility limits for the pay-later providers are
 * MOCK values.
 * TODO(api): Tabby and Tamara settle in SAR/AED (and mada is a Saudi network) while the catalog is
 * priced in USD; the real integration needs a currency decision, and the providers' own
 * pre-scoring calls replace the static limits.
 */
export const PAYMENT_METHODS: readonly PaymentMethodDef[] = [
  {
    id: "card",
    label: "بطاقة ائتمانية",
    description: "ادفع ببطاقة Visa أو Mastercard عبر Stripe.",
    marks: ["VISA", "Mastercard"],
    provider: "stripe",
  },
  {
    id: "mada",
    label: "بطاقة مدى",
    description: "ادفع ببطاقة مدى أو Visa الصادرة من بنك سعودي.",
    marks: ["mada", "VISA"],
    provider: "stripe",
  },
  {
    id: "apple_pay",
    label: "Apple Pay",
    description: "ادفع بلمسة من جهاز Apple، دون إدخال بيانات البطاقة.",
    marks: ["Apple Pay"],
    provider: "stripe",
    requires: "apple_pay",
  },
  {
    id: "tabby",
    label: "تابي",
    description: "قسّم المبلغ على 4 دفعات بلا فوائد.",
    marks: ["tabby"],
    provider: "tabby",
    installments: 4,
    min: 10,
    max: 1500,
  },
  {
    id: "tamara",
    label: "تمارا",
    description: "قسّم المبلغ على 3 دفعات بلا فوائد.",
    marks: ["tamara"],
    provider: "tamara",
    installments: 3,
    min: 25,
    max: 2000,
  },
];

export function findPaymentMethod(id: PaymentMethodId | null | undefined): PaymentMethodDef | null {
  return PAYMENT_METHODS.find((method) => method.id === id) ?? null;
}

export const PAYMENT_METHOD_IDS: readonly PaymentMethodId[] = PAYMENT_METHODS.map((method) => method.id);
