import type { PaymentMethodId } from "@/lib/shop/contract";

/** A card network or provider logo from `public/icons`. */
export type PaymentMark = {
  src: string;
  name: string;
  /** Visa and mada are drawn in a band across a square canvas: `cover` crops the empty top and bottom. */
  fit: "object-cover" | "object-contain";
};

export type PaymentMethodDef = {
  id: PaymentMethodId;
  label: string;
  description: string;
  /** Card networks beside the label. Tamara shows its own gradient logo instead (see `TamaraLogo`). */
  marks: readonly PaymentMark[];
  /** The provider the order is handed to. */
  provider: "stripe" | "tamara";
};

export const PAYMENT_MARKS = {
  visa: { src: "/icons/visa.svg", name: "Visa", fit: "object-cover" },
  mastercard: { src: "/icons/mastercard.svg", name: "Mastercard", fit: "object-contain" },
  mada: { src: "/icons/Mada-01.svg", name: "مدى", fit: "object-cover" },
} as const satisfies Record<string, PaymentMark>;

/**
 * The payment methods the academy supports. Tamara's eligibility (amount limits, plans) comes from
 * `GET /payments/tamara/options`, not from here: it charges in AED, converted from the USD price.
 */
export const PAYMENT_METHODS: readonly PaymentMethodDef[] = [
  {
    id: "card",
    label: "بطاقة ائتمانية أو مدى",
    description: "ادفع ببطاقة Visa أو Mastercard أو مدى عبر Stripe.",
    marks: [PAYMENT_MARKS.visa, PAYMENT_MARKS.mastercard, PAYMENT_MARKS.mada],
    provider: "stripe",
  },
  {
    id: "tamara",
    label: "تمارا",
    // Tamara's checkout messaging for the UAE: "Monthly payments. No late fees."
    description: "دفعات شهرية. بدون رسوم تأخير.",
    marks: [],
    provider: "tamara",
  },
];

export function findPaymentMethod(id: PaymentMethodId | null | undefined): PaymentMethodDef | null {
  return PAYMENT_METHODS.find((method) => method.id === id) ?? null;
}

export const PAYMENT_METHOD_IDS: readonly PaymentMethodId[] = PAYMENT_METHODS.map((method) => method.id);
