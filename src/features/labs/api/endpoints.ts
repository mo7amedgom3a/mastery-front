/**
 * The labs endpoint map. Paths are relative to `/api/v1` (the live transport adds the prefix;
 * the mock server matches these paths directly). Operation ids match the planned FastAPI routes
 * so the contract can switch to generated OpenAPI types without changing call sites.
 */
export const labPaths = {
  listLabs: "/labs",
  getLab: (slug: string) => `/labs/${encodeURIComponent(slug)}`,
  recommendations: (slug: string) => `/labs/${encodeURIComponent(slug)}/recommendations`,
  startSession: (slug: string) => `/labs/${encodeURIComponent(slug)}/sessions`,

  session: (sessionId: string) => `/me/labs/sessions/${encodeURIComponent(sessionId)}`,
  actions: (sessionId: string) => `/me/labs/sessions/${encodeURIComponent(sessionId)}/actions`,
  complete: (sessionId: string) => `/me/labs/sessions/${encodeURIComponent(sessionId)}/complete`,
  abandon: (sessionId: string) => `/me/labs/sessions/${encodeURIComponent(sessionId)}/abandon`,

  attempts: "/me/labs/attempts",
  attempt: (attemptId: string) => `/me/labs/attempts/${encodeURIComponent(attemptId)}`,
  insights: "/me/labs/insights",
  portfolio: "/me/labs/portfolio",
  demo: "/me/labs/demo",

  adminLabs: "/admin/labs",
  adminLab: (labId: string) => `/admin/labs/${encodeURIComponent(labId)}`,
  adminDraft: (labId: string) => `/admin/labs/${encodeURIComponent(labId)}/draft`,
  adminValidate: (labId: string) => `/admin/labs/${encodeURIComponent(labId)}/validate`,
  adminPublish: (labId: string) => `/admin/labs/${encodeURIComponent(labId)}/publish`,
  adminUnpublish: (labId: string) => `/admin/labs/${encodeURIComponent(labId)}/unpublish`,
  adminArchive: (labId: string) => `/admin/labs/${encodeURIComponent(labId)}/archive`,
  adminDuplicate: (labId: string) => `/admin/labs/${encodeURIComponent(labId)}/duplicate`,
  adminVersions: (labId: string) => `/admin/labs/${encodeURIComponent(labId)}/versions`,
  adminVersion: (labId: string, version: number) => `/admin/labs/${encodeURIComponent(labId)}/versions/${version}`,
  adminRestore: (labId: string, version: number) =>
    `/admin/labs/${encodeURIComponent(labId)}/versions/${version}/restore`,
  adminPreview: (labId: string) => `/admin/labs/${encodeURIComponent(labId)}/preview`,
  adminAnalytics: (labId: string) => `/admin/labs/${encodeURIComponent(labId)}/analytics`,
  adminAttempts: (labId: string) => `/admin/labs/${encodeURIComponent(labId)}/attempts`,
  adminAttempt: (attemptId: string) => `/admin/labs/attempts/${encodeURIComponent(attemptId)}`,
  adminFlagAttempt: (attemptId: string) => `/admin/labs/attempts/${encodeURIComponent(attemptId)}/flag`,
  adminResetAttempt: (attemptId: string) => `/admin/labs/attempts/${encodeURIComponent(attemptId)}/reset`,
  adminOverrideScore: (attemptId: string) => `/admin/labs/attempts/${encodeURIComponent(attemptId)}/override-score`,
  adminAssignments: (labId: string) => `/admin/labs/${encodeURIComponent(labId)}/assignments`,
  adminAssignment: (labId: string, assignmentId: string) =>
    `/admin/labs/${encodeURIComponent(labId)}/assignments/${encodeURIComponent(assignmentId)}`,
  adminRelease: (labId: string) => `/admin/labs/${encodeURIComponent(labId)}/release`,
  adminGenerate: "/admin/labs/generate",
  adminGeneration: (jobId: string) => `/admin/labs/generate/${encodeURIComponent(jobId)}`,
  adminApplyGeneration: (jobId: string) => `/admin/labs/generate/${encodeURIComponent(jobId)}/apply`,
  adminOverview: "/admin/labs/overview",
  adminTemplates: "/admin/labs/templates",
  adminFields: "/admin/labs/fields",
  adminAssets: (labId: string) => `/admin/labs/${encodeURIComponent(labId)}/assets`,
  adminAsset: (labId: string, assetId: string) =>
    `/admin/labs/${encodeURIComponent(labId)}/assets/${encodeURIComponent(assetId)}`,
  adminAssetUploadUrl: (labId: string) => `/admin/labs/${encodeURIComponent(labId)}/assets/upload-url`,
  adminExport: (labId: string) => `/admin/labs/${encodeURIComponent(labId)}/export`,
  adminImport: (labId: string) => `/admin/labs/${encodeURIComponent(labId)}/import`,
} as const;

export type LabHttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
