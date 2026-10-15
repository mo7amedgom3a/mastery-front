import type { DetailedHTMLProps, HTMLAttributes } from "react";

/** Tamara's official widget (widget-v2): a custom element rendered by its CDN script. */
type TamaraWidgetAttributes = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  type: "tamara-summary" | "tamara-card-snippet";
  amount: string;
  "inline-type"?: string;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "tamara-widget": TamaraWidgetAttributes;
    }
  }
}

declare global {
  interface Window {
    tamaraWidgetConfig?: { lang: "ar" | "en"; country: string; publicKey: string };
    TamaraWidgetV2?: { refresh: () => void };
  }
}
