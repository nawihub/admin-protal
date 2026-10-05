import { api } from "@/lib/api/http";
import type {
  AuditLog, BatchJob, Business, CategoryAnalysis, Competition, CompetitionApplication, CompetitionEntrants, CompetitionEvent,
  CompetitionInput, CursorPage, Entrepreneur, Folder, Idea, Journey, ManagedUser, OffsetPage, Opportunity, Permission,
  Resource, Venture,
} from "@/lib/api/types";

/** Shared cursor-list query params. */
export interface CursorQuery {
  pageSize?: number;
  pageToken?: string;
}

type Q = Record<string, string | string[] | number | boolean | undefined | null>;

// ─── Big ideas ──────────────────────────────────────────────────────────────
export const ideasApi = {
  list: (q: CursorQuery & { status?: string; stage?: string; submissionType?: string; searchQuery?: string }) =>
    api.get<CursorPage<Idea>>("/api/v1/big-ideas", { query: q as Q }),
  get: (id: string) => api.get<Idea>(`/api/v1/big-ideas/${id}`),
  review: (id: string) => api.post(`/api/v1/big-ideas/${id}/review`),
  approve: (id: string) => api.post(`/api/v1/big-ideas/${id}/approve`),
  decline: (id: string, reason: string) => api.post(`/api/v1/big-ideas/${id}/decline`, { reason }),
  remove: (id: string) => api.delete(`/api/v1/big-ideas/${id}`),
  material: (url: string) => api.blob(url, { timeoutMs: 120_000 }),
  /** Deletes in the background: resolves at once with the queued job (see batchJobsApi). */
  batchDelete: (ids: string[]) => api.post<BatchJob>("/api/v1/big-ideas/batch", { ids, action: "delete" }),
};

// ─── Competitions ───────────────────────────────────────────────────────────
interface OffsetTokenPage<T> { items: T[]; nextPageToken: string | null; totalCount: number }

/** Competition listings page with an opaque token; reshaped to the cursor-page form the list hooks use. */
function toCursorPage<T>(page: OffsetTokenPage<T>, pageSize: number): CursorPage<T> {
  return {
    items: page.items, pageSize, returnedCount: page.items.length, totalCount: page.totalCount,
    hasNextPage: !!page.nextPageToken, nextPageToken: page.nextPageToken,
    hasPreviousPage: false, previousPageToken: null,
  };
}

export const competitionsApi = {
  list: async (q: CursorQuery & { state?: string[]; search?: string }) =>
    toCursorPage(await api.get<OffsetTokenPage<Competition>>("/api/v1/competitions", { query: q as Q }), q.pageSize ?? 20),
  get: (id: string) => api.get<Competition>(`/api/v1/competitions/${id}`),
  create: (body: CompetitionInput) => api.post<Competition>("/api/v1/competitions", body),
  update: (id: string, body: CompetitionInput) => api.put<Competition>(`/api/v1/competitions/${id}`, body),
  remove: (id: string) => api.delete(`/api/v1/competitions/${id}`),
  publish: (id: string) => api.post<Competition>(`/api/v1/competitions/${id}/publish`),
  startShortlisting: (id: string) => api.post<Competition>(`/api/v1/competitions/${id}/start-shortlisting`),
  announceShortlist: (id: string) => api.post<Competition>(`/api/v1/competitions/${id}/announce-shortlist`),
  announceFinalists: (id: string) => api.post<Competition>(`/api/v1/competitions/${id}/announce-finalists`),
  declareWinners: (id: string, applicationIds: string[]) => api.post<Competition>(`/api/v1/competitions/${id}/winners`, { applicationIds }),
  cancel: (id: string, reason: string) => api.post<Competition>(`/api/v1/competitions/${id}/cancel`, { reason }),
  entrants: (id: string) => api.get<CompetitionEntrants>(`/api/v1/competitions/${id}/entrants`),
  events: async (id: string, q: CursorQuery & { applicationId?: string }) =>
    toCursorPage(await api.get<OffsetTokenPage<CompetitionEvent>>(`/api/v1/competitions/${id}/events`, { query: q as Q }), q.pageSize ?? 50),
  applications: async (id: string, q: CursorQuery & { state?: string[]; search?: string; order?: "score" }) =>
    toCursorPage(await api.get<OffsetTokenPage<CompetitionApplication>>(`/api/v1/competitions/${id}/applications`, { query: q as Q }), q.pageSize ?? 50),
  application: (applicationId: string) => api.get<CompetitionApplication>(`/api/v1/competitions/applications/${applicationId}`),
  score: (applicationId: string, scores: { criterionId: string; score: number }[], note?: string) =>
    api.post<CompetitionApplication>(`/api/v1/competitions/applications/${applicationId}/score`, { scores, note }),
  decide: (applicationId: string, decision: "ADVANCE" | "REJECT" | "NONE", note?: string) =>
    api.post<CompetitionApplication>(`/api/v1/competitions/applications/${applicationId}/decision`, { decision, note }),
  file: (applicationId: string, fileId: string) =>
    api.blob(`/api/v1/competitions/applications/${applicationId}/files/${fileId}?inline=true`, { timeoutMs: 600_000 }),
};

// ─── Opportunities ──────────────────────────────────────────────────────────
export const opportunitiesApi = {
  list: (q: CursorQuery & { status?: string; searchQuery?: string; categories?: string[]; geographicScope?: string }) =>
    api.get<CursorPage<Opportunity>>("/api/v1/opportunities", { query: q as Q }),
  get: (id: string) => api.get<Opportunity>(`/api/v1/opportunities/${id}`),
  analysis: () => api.get<CategoryAnalysis[]>("/api/v1/opportunities/analysis"),
  review: (id: string) => api.post(`/api/v1/opportunities/${id}/review`),
  approve: (id: string) => api.post(`/api/v1/opportunities/${id}/approve`),
  decline: (id: string, reason: string) => api.post(`/api/v1/opportunities/${id}/decline`, { reason }),
  remove: (id: string) => api.delete(`/api/v1/opportunities/${id}`),
  flier: (id: string) => api.blob(`/api/v1/opportunities/${id}/flier`),
  /** Deletes in the background: resolves at once with the queued job (see batchJobsApi). */
  batchDelete: (ids: string[]) => api.post<BatchJob>("/api/v1/opportunities/batch", { ids, action: "delete" }),
};

// ─── Businesses ─────────────────────────────────────────────────────────────
export const businessesApi = {
  list: (q: CursorQuery & { status?: string; query?: string; categories?: string[]; trackingId?: string }) =>
    api.get<CursorPage<Business>>("/api/v1/businesses", { query: q as Q }),
  get: (id: string) => api.get<Business>(`/api/v1/businesses/${id}`),
  markInReview: (id: string) => api.post(`/api/v1/businesses/${id}/mark-in-review`),
  requestPayment: (id: string) => api.post(`/api/v1/businesses/${id}/request-payment`),
  confirmPayment: (id: string) => api.post(`/api/v1/businesses/${id}/confirm-payment`),
  approve: (id: string, registrationNumber: string, registerDate: string) =>
    api.post(`/api/v1/businesses/${id}/approve`, { registrationNumber, registerDate }),
  reject: (id: string, rejectionReason: string) => api.post(`/api/v1/businesses/${id}/reject`, { rejectionReason }),
  document: (id: string) => api.blob(`/api/v1/businesses/${id}/document`, { timeoutMs: 60_000 }),
};

// ─── Entrepreneurs ──────────────────────────────────────────────────────────
export const entrepreneursApi = {
  list: (q: CursorQuery & { status?: string; query?: string; vetted?: boolean; featured?: boolean; district?: string }) =>
    api.get<CursorPage<Entrepreneur>>("/api/v1/entrepreneurs", { query: q as Q }),
  get: (id: string) => api.get<Entrepreneur>(`/api/v1/entrepreneurs/${id}`),
  ventures: (id: string) => api.get<Venture[]>(`/api/v1/entrepreneurs/${id}/ventures`),
  journeys: (id: string) => api.get<Journey[]>(`/api/v1/entrepreneurs/${id}/journeys`),
  activate: (id: string) => api.post<Entrepreneur>(`/api/v1/entrepreneurs/${id}/activate`),
  feature: (id: string) => api.post<Entrepreneur>(`/api/v1/entrepreneurs/${id}/feature`),
  vet: (id: string) => api.post<Entrepreneur>(`/api/v1/entrepreneurs/${id}/vet`),
  suspend: (id: string, suspendReason: string) => api.post<Entrepreneur>(`/api/v1/entrepreneurs/${id}/suspend`, { suspendReason }),
  unsuspend: (id: string) => api.post<Entrepreneur>(`/api/v1/entrepreneurs/${id}/unsuspend`),
  photo: (id: string) => api.blob(`/api/v1/entrepreneurs/${id}/profile-image`),
};

// ─── Resources ──────────────────────────────────────────────────────────────
export const resourcesApi = {
  folders: (q: CursorQuery & { query?: string }) => api.get<CursorPage<Folder>>("/api/v1/resources/folders", { query: q as Q }),
  folder: (id: string) => api.get<Folder>(`/api/v1/resources/folders/${id}`),
  createFolder: (name: string) => api.post<Folder>("/api/v1/resources/folders", { name }),
  deleteFolder: (id: string) => api.delete(`/api/v1/resources/folders/${id}`),
  inFolder: (folderId: string, q: CursorQuery & { status?: string; query?: string; type?: string }) =>
    api.get<CursorPage<Resource>>(`/api/v1/resources/folders/${folderId}/resources`, { query: q as Q }),
  get: (id: string) => api.get<Resource>(`/api/v1/resources/${id}`),
  upload: (form: FormData) => api.upload<Resource>("/api/v1/resources", form, { timeoutMs: 10 * 60_000 }),
  approve: (id: string, featured: boolean) => api.post(`/api/v1/resources/${id}/approve`, { featured }),
  reject: (id: string, reason: string) => api.post(`/api/v1/resources/${id}/reject`, { reason }),
  remove: (id: string) => api.delete(`/api/v1/resources/${id}`),
  download: (id: string) => api.blob(`/api/v1/resources/${id}/download`, { timeoutMs: 10 * 60_000 }),
  thumbnail: (id: string) => api.blob(`/api/v1/resources/${id}/thumbnail`),
  /** Deletes in the background: resolves at once with the queued job (see batchJobsApi). */
  batchDelete: (ids: string[]) => api.post<BatchJob>("/api/v1/resources/batch", { ids, action: "delete" }),
};

// ─── Admin users ────────────────────────────────────────────────────────────
export const usersApi = {
  list: (q: { status?: string; query?: string; page?: number; size?: number }) =>
    api.get<OffsetPage<ManagedUser>>("/api/v1/users", { query: q as Q }),
  get: (id: string) => api.get<ManagedUser>(`/api/v1/users/${id}`),
  /** Admins start with the default read-only permissions; FULL_ACCESS comes from createAdmin. */
  create: (body: { firstName: string; lastName: string; email: string; username: string; fullAccess: boolean }) => {
    const { fullAccess, ...rest } = body;
    return api.post<ManagedUser>(fullAccess ? "/api/v1/users/admins" : "/api/v1/users", {
      ...rest,
      idempotencyKey: crypto.randomUUID(),
    });
  },
  updateProfile: (id: string, firstName: string, lastName: string) =>
    api.patch<ManagedUser>(`/api/v1/users/${id}`, { firstName, lastName }),
  changePassword: (oldPassword: string, newPassword: string) =>
    api.put<ManagedUser>("/api/v1/users/password", { oldPassword, newPassword }),
  activate: (userId: string) => api.post<ManagedUser>("/api/v1/users/activate", { userId }),
  deactivate: (userId: string) => api.post<ManagedUser>("/api/v1/users/deactivate", { userId }),
  oneTimeCode: (id: string) => api.get<{ userId: string; oneTimeCode: string }>(`/api/v1/users/${id}/one-time-code`),
  resetPassword: (userId: string) => api.post<ManagedUser>("/api/v1/users/reset-password", { userId }),
  assignPermissions: (userId: string, permissions: Permission[]) =>
    api.post<ManagedUser>("/api/v1/users/assign-permissions", { userId, permissions }),
  remove: (id: string) => api.delete(`/api/v1/users/${id}`),
};

// ─── Audit logs ─────────────────────────────────────────────────────────────
export const auditApi = {
  list: (q: { action?: string; resource?: string; userId?: string; query?: string; dateFrom?: string; dateTo?: string; page?: number; size?: number }) =>
    api.get<OffsetPage<AuditLog>>("/api/v1/audit-logs", { query: q as Q }),
};

// ─── Background batch jobs ──────────────────────────────────────────────────
export const batchJobsApi = {
  /** The signed-in admin's recent batch deletions across every area they manage, newest first. */
  recent: (limit = 20) => api.get<BatchJob[]>("/api/v1/batch-jobs", { query: { limit } }),
};
