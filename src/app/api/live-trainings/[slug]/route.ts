import { NextResponse } from "next/server";

import { getLiveTrainingDetailDto } from "@/features/live-training/api/get-live-trainings";

/**
 * MOCK endpoint: one live training with its page content (`details`), in the shape the backend is
 * expected to return. 404 for an unknown slug.
 */
export async function GET(_request: Request, { params }: RouteContext<"/api/live-trainings/[slug]">) {
  const { slug } = await params;
  const training = await getLiveTrainingDetailDto(slug);
  if (!training) {
    return NextResponse.json({ detail: "Live training not found" }, { status: 404 });
  }
  return NextResponse.json(training, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
  });
}
