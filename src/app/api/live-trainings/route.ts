import { NextResponse, type NextRequest } from "next/server";

import { getLiveTrainingDtos } from "@/features/live-training/api/get-live-trainings";
import type { LiveTrainingsResponse } from "@/features/live-training/model/types";

const MAX_LIMIT = 50;

/**
 * MOCK endpoint: the live-trainings list in the shape the backend is expected to return, served
 * from `features/live-training/api/mock-data.ts`. `?limit=` caps the items (1–50); `total` counts all.
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("limit");
  const limit = raw === null ? MAX_LIMIT : Number(raw);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    return NextResponse.json({ detail: `limit must be an integer between 1 and ${MAX_LIMIT}` }, { status: 422 });
  }

  const items = await getLiveTrainingDtos();
  const body: LiveTrainingsResponse = { items: items.slice(0, limit), total: items.length };
  return NextResponse.json(body, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" } });
}
