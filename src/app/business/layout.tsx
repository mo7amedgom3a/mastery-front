import type { ReactNode } from "react";

import "@/features/business/styles/b2b-landing.css";

/** Layout only imports the business stylesheet; `/business/request` keeps its own flow untouched. */
export default function BusinessLayout({ children }: { children: ReactNode }) {
  return children;
}
