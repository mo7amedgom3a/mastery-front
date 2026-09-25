import type { operations } from "@/types/openapi";

type JsonContent<T> = T extends { content: { "application/json": infer Content } } ? Content : void;

export type SuccessResponse<Operation extends keyof operations> =
  200 extends keyof operations[Operation]["responses"]
    ? JsonContent<operations[Operation]["responses"][200]>
    : 201 extends keyof operations[Operation]["responses"]
      ? JsonContent<operations[Operation]["responses"][201]>
      : 204 extends keyof operations[Operation]["responses"]
        ? void
        : never;

export type QueryParams<Operation extends keyof operations> =
  operations[Operation]["parameters"] extends { query?: infer Query } ? NonNullable<Query> : never;

export type PathParams<Operation extends keyof operations> =
  operations[Operation]["parameters"] extends { path: infer Path } ? Path : never;

export type RequestBody<Operation extends keyof operations> =
  operations[Operation] extends { requestBody: { content: { "application/json": infer Body } } }
    ? Body
    : never;
