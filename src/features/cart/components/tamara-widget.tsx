"use client";

import Image from "next/image";
import { useEffect } from "react";

import { cn } from "@/lib/cn";
import type { TamaraOptionsResponse } from "@/lib/api/commerce";

const SCRIPT_ATTRIBUTE = "data-tamara-widget";

/**
 * Layouts of Tamara's `tamara-summary` widget (`inline-type`), per its widget-v2 script: 2 is the
 * product/cart message ("Pay AED x/mo … No late fees. More options" with the logo and pop-up).
 */
const INLINE_TYPE = { cart: "2" } as const;

function scriptUrl(environment: string): string {
  return environment === "production"
    ? "https://cdn.tamara.co/widget-v2/tamara-widget.js"
    : "https://cdn-sandbox.tamara.co/widget-v2/tamara-widget.js";
}

/**
 * Tamara's official widget. It carries the guideline's messaging pillars (monthly amount, "or in
 * X payments", no late fees, "More options" with Tamara's pop-up, gradient logo), computed by
 * Tamara from the amount: the cart total in Tamara's currency, so it follows every cart change.
 */
export function TamaraWidget({
  options,
  placement,
}: {
  options: TamaraOptionsResponse & { public_key: string };
  placement: keyof typeof INLINE_TYPE;
}) {
  const amount = (options.amount_minor / 100).toFixed(2);

  useEffect(() => {
    window.tamaraWidgetConfig = { lang: "ar", country: options.country_code, publicKey: options.public_key };
    if (window.TamaraWidgetV2) {
      window.TamaraWidgetV2.refresh();
      return;
    }
    // Loading: the script renders every widget on the page once it runs.
    if (document.querySelector(`script[${SCRIPT_ATTRIBUTE}]`)) return;
    const script = document.createElement("script");
    script.src = scriptUrl(options.environment);
    script.defer = true;
    script.setAttribute(SCRIPT_ATTRIBUTE, "");
    document.head.appendChild(script);
  }, [amount, options.country_code, options.public_key, options.environment, placement]);

  // Re-created on a new amount: the widget reads its attributes when it renders.
  return <tamara-widget key={amount} type="tamara-summary" inline-type={INLINE_TYPE[placement]} amount={amount} />;
}

/**
 * Tamara's official gradient wordmark (brand kit v2), unaltered: 28px high on mobile, 32px on
 * desktop, as the widget guidelines ask. Arabic on this Arabic site.
 */
export function TamaraLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/icons/tamara-logo-ar.png"
      alt="تمارا"
      width={296}
      height={96}
      className={cn("h-7 w-auto shrink-0 md:h-8", className)}
    />
  );
}
