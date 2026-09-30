import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import type { z } from "zod";

import type { Quote, ShopErrorBody, ShopErrorCode } from "@/lib/shop/contract";

/** Per visitor: never stored by a shared cache. */
const NO_STORE = { "Cache-Control": "private, no-store" };

export function shopJson<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status, headers: NO_STORE });
}

export function shopError(status: number, code: ShopErrorCode, message: string, quote?: Quote): NextResponse {
  const body: ShopErrorBody = quote ? { code, message, quote } : { code, message };
  return NextResponse.json(body, { status, headers: NO_STORE });
}

/** The request's JSON body checked against `schema`; a ready 400 response when it doesn't fit. */
export async function readBody<S extends z.ZodType>(
  request: NextRequest,
  schema: S,
): Promise<{ data: z.infer<S> } | { error: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { error: shopError(400, "invalid_request", "تعذّر قراءة الطلب.") };
  }
  const parsed = schema.safeParse(raw);
  return parsed.success ? { data: parsed.data } : { error: shopError(400, "invalid_request", "بيانات الطلب غير صحيحة.") };
}

/** The catalog couldn't be read: the visitor's items are fine, the prices just aren't known right now. */
export function catalogUnavailable(error: unknown): NextResponse {
  console.error("[shop] catalog read failed", error);
  return NextResponse.json(
    { code: "invalid_request", message: "تعذّر تحميل الأسعار حالياً. حاول مجدداً بعد قليل." } satisfies ShopErrorBody,
    { status: 502, headers: NO_STORE },
  );
}
