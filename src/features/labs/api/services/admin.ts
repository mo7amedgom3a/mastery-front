import { queryOptions } from "@tanstack/react-query";

import { getLabTransport } from "../client";
import type {
  AdminLab,
  AdminLabList,
  LabAnalytics,
  LabApiQuery,
  LabAsset,
  LabAssignment,
  LabAttempt,
  LabAttemptList,
  LabDefinitionPayload,
  LabDraft,
  LabGenerationJob,
  LabGenerationRequest,
  LabOverview,
  LabPreviewToken,
  LabValidation,
  LabVersion,
} from "../contract";
import { labPaths } from "../endpoints";

export const adminLabKeys = {
  all: ["labs", "admin"] as const,
  list: (query?: LabApiQuery) => [...adminLabKeys.all, "list", query ?? {}] as const,
  detail: (labId: string) => [...adminLabKeys.all, "detail", labId] as const,
  draft: (labId: string) => [...adminLabKeys.all, "draft", labId] as const,
  versions: (labId: string) => [...adminLabKeys.all, "versions", labId] as const,
  analytics: (labId: string) => [...adminLabKeys.all, "analytics", labId] as const,
  attempts: (labId: string) => [...adminLabKeys.all, "attempts", labId] as const,
  assignments: (labId: string) => [...adminLabKeys.all, "assignments", labId] as const,
  overview: () => [...adminLabKeys.all, "overview"] as const,
  generation: (jobId: string) => [...adminLabKeys.all, "generation", jobId] as const,
};

async function request<T>(method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", path: string, options: { query?: LabApiQuery; body?: unknown } = {}): Promise<T> {
  const transport = await getLabTransport();
  return transport.request<T>(method, path, options);
}

export function listAdminLabs(query?: LabApiQuery): Promise<AdminLabList> {
  return request("GET", labPaths.adminLabs, { query });
}

export function getAdminLab(labId: string): Promise<LabDraft> {
  return request("GET", labPaths.adminLab(labId));
}

export function createAdminLab(definition?: LabDefinitionPayload): Promise<AdminLab> {
  return request("POST", labPaths.adminLabs, { body: { definition } });
}

export function updateAdminLab(labId: string, definition: Partial<LabDefinitionPayload>): Promise<AdminLab> {
  return request("PATCH", labPaths.adminLab(labId), { body: { definition } });
}

export function deleteAdminLab(labId: string): Promise<{ ok: true }> {
  return request("DELETE", labPaths.adminLab(labId));
}

export function getAdminDraft(labId: string): Promise<LabDraft> {
  return request("GET", labPaths.adminDraft(labId));
}

export function saveAdminDraft(labId: string, baseRevision: number, definition: LabDefinitionPayload): Promise<LabDraft> {
  return request("PUT", labPaths.adminDraft(labId), { body: { base_revision: baseRevision, definition } });
}

export function validateAdminLab(labId: string): Promise<LabValidation> {
  return request("POST", labPaths.adminValidate(labId));
}

export function publishAdminLab(labId: string): Promise<AdminLab> {
  return request("POST", labPaths.adminPublish(labId));
}

export function unpublishAdminLab(labId: string): Promise<AdminLab> {
  return request("POST", labPaths.adminUnpublish(labId));
}

export function archiveAdminLab(labId: string): Promise<AdminLab> {
  return request("POST", labPaths.adminArchive(labId));
}

export function duplicateAdminLab(labId: string): Promise<AdminLab> {
  return request("POST", labPaths.adminDuplicate(labId));
}

export function listAdminVersions(labId: string): Promise<LabVersion[]> {
  return request("GET", labPaths.adminVersions(labId));
}

export function restoreAdminVersion(labId: string, version: number): Promise<LabDraft> {
  return request("POST", labPaths.adminRestore(labId, version));
}

export function previewAdminLab(labId: string): Promise<LabPreviewToken> {
  return request("POST", labPaths.adminPreview(labId));
}

export function getAdminAnalytics(labId: string): Promise<LabAnalytics> {
  return request("GET", labPaths.adminAnalytics(labId));
}

export function listAdminAttempts(labId: string): Promise<LabAttemptList> {
  return request("GET", labPaths.adminAttempts(labId));
}

export function getAdminAttempt(attemptId: string): Promise<LabAttempt> {
  return request("GET", labPaths.adminAttempt(attemptId));
}

export function flagAdminAttempt(attemptId: string): Promise<LabAttempt> {
  return request("POST", labPaths.adminFlagAttempt(attemptId));
}

export function resetAdminAttempt(attemptId: string): Promise<LabAttempt> {
  return request("POST", labPaths.adminResetAttempt(attemptId));
}

export function overrideAdminScore(attemptId: string, overall: number): Promise<LabAttempt> {
  return request("POST", labPaths.adminOverrideScore(attemptId), { body: { overall } });
}

export function listAdminAssignments(labId: string): Promise<LabAssignment[]> {
  return request("GET", labPaths.adminAssignments(labId));
}

export function createAdminAssignment(
  labId: string,
  input: Omit<LabAssignment, "assignment_id" | "lab_id" | "created_at">,
): Promise<LabAssignment> {
  return request("POST", labPaths.adminAssignments(labId), { body: input });
}

export function deleteAdminAssignment(labId: string, assignmentId: string): Promise<{ ok: true }> {
  return request("DELETE", labPaths.adminAssignment(labId, assignmentId));
}

export function updateAdminRelease(labId: string, release: Partial<LabDefinitionPayload["release"]>): Promise<AdminLab> {
  return request("PUT", labPaths.adminRelease(labId), { body: release });
}

export function generateAdminLab(input: LabGenerationRequest): Promise<LabGenerationJob> {
  return request("POST", labPaths.adminGenerate, { body: input });
}

export function getAdminGeneration(jobId: string): Promise<LabGenerationJob> {
  return request("GET", labPaths.adminGeneration(jobId));
}

export function applyAdminGeneration(jobId: string): Promise<AdminLab> {
  return request("POST", labPaths.adminApplyGeneration(jobId));
}

export function getAdminOverview(): Promise<LabOverview> {
  return request("GET", labPaths.adminOverview);
}

export function listAdminTemplates(): Promise<{ slug: string; title: string; field_category_id: number }[]> {
  return request("GET", labPaths.adminTemplates);
}

export function listAdminFields(): Promise<string[]> {
  return request("GET", labPaths.adminFields);
}

export function requestAdminAssetUpload(labId: string, filename: string): Promise<{ upload_url: string; key: string; method: string; headers: Record<string, string> }> {
  return request("POST", labPaths.adminAssetUploadUrl(labId), { body: { filename } });
}

export function createAdminAsset(labId: string, input: { url: string; filename: string; content_type?: string; size_bytes?: number; alt_text?: string }): Promise<LabAsset> {
  return request("POST", labPaths.adminAssets(labId), { body: input });
}

export function listAdminAssets(labId: string): Promise<LabAsset[]> {
  return request("GET", labPaths.adminAssets(labId));
}

export function deleteAdminAsset(labId: string, assetId: string): Promise<{ ok: true }> {
  return request("DELETE", labPaths.adminAsset(labId, assetId));
}

export function exportAdminLab(labId: string): Promise<LabDefinitionPayload> {
  return request("GET", labPaths.adminExport(labId));
}

export function importAdminLab(labId: string, definition: LabDefinitionPayload): Promise<AdminLab> {
  return request("POST", labPaths.adminImport(labId), { body: { definition } });
}

export const adminLabQueries = {
  list: (query?: LabApiQuery) =>
    queryOptions({ queryKey: adminLabKeys.list(query), queryFn: () => listAdminLabs(query), staleTime: 30_000 }),
  detail: (labId: string) =>
    queryOptions({ queryKey: adminLabKeys.detail(labId), queryFn: () => getAdminLab(labId), staleTime: 10_000 }),
  versions: (labId: string) =>
    queryOptions({ queryKey: adminLabKeys.versions(labId), queryFn: () => listAdminVersions(labId), staleTime: 30_000 }),
  analytics: (labId: string) =>
    queryOptions({ queryKey: adminLabKeys.analytics(labId), queryFn: () => getAdminAnalytics(labId), staleTime: 30_000 }),
  attempts: (labId: string) =>
    queryOptions({ queryKey: adminLabKeys.attempts(labId), queryFn: () => listAdminAttempts(labId), staleTime: 15_000 }),
  assignments: (labId: string) =>
    queryOptions({ queryKey: adminLabKeys.assignments(labId), queryFn: () => listAdminAssignments(labId), staleTime: 30_000 }),
  overview: () => queryOptions({ queryKey: adminLabKeys.overview(), queryFn: getAdminOverview, staleTime: 30_000 }),
};
