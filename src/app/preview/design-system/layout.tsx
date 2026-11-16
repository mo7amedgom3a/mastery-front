import type { ReactNode } from "react";

import "./preview.css";

/** The specimen is the only place the extracted study tokens load; the rest of the app never sees them. */
export default function DesignSystemPreviewLayout({ children }: { children: ReactNode }) {
  return children;
}
