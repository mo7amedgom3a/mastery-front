"use client";

import dynamic from "next/dynamic";

// The page only makes sense in a browser (it reads the egress query string and joins the room).
const RecorderRoot = dynamic(() => import("./recorder-root"), { ssr: false });

export function RecorderEntry() {
  return <RecorderRoot />;
}
