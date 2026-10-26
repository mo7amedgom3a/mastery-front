import { NextResponse } from "next/server";

import { getConsultationDetail } from "@/features/consultation-detail/api/get-consultation-detail";

/** The consultation page data for the admin Studio's live preview; the unsaved page is overlaid in the browser. */
export async function GET(request: Request) {
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isSafeInteger(id) || id <= 0) {
    return NextResponse.json({ error: "bad consultation id" }, { status: 400 });
  }
  try {
    const data = await getConsultationDetail(id);
    if (!data) return NextResponse.json({ error: "consultation not found" }, { status: 404 });
    return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "consultation unavailable" }, { status: 500 });
  }
}
