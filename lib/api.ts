import { toast } from "sonner";
import { clearTokens, getTokens, setTokens } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Response types ────────────────────────────────────────────────────────

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JwtPayload {
  sub: string;
  role: string;
  tier: string;
  iat: number;
  exp: number;
}

export function decodeJwt(token: string): JwtPayload {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as JwtPayload;
  } catch {
    throw new Error("Invalid token");
  }
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface UserSubscription {
  tier: "FREE" | "PRO" | "PREMIUM";
  status: "ACTIVE" | "PAST_DUE" | "CANCELED" | "TRIALING" | "INCOMPLETE";
}

export interface UserListItem {
  id: string;
  email: string;
  role: "PATIENT" | "ADMIN";
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  lockedUntil: string | null;
  createdAt: string;
  deletedAt: string | null;
  subscription: UserSubscription | null;
}

export interface UserProfile {
  firstName?: string | null;
  lastName?: string | null;
  dateOfBirth?: string | null;
  biologicalSex?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  phone?: string | null;
  [key: string]: unknown;
}

export interface UserDetail {
  id: string;
  email: string;
  role: "PATIENT" | "ADMIN";
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  profile: UserProfile | null;
  subscription: BillingDetail | null;
}

export interface UpdateUserBody {
  role?: "PATIENT" | "ADMIN";
  lockedUntil?: string | null;
}

export interface UserUpdateResponse {
  id: string;
  email: string;
  role: "PATIENT" | "ADMIN";
  lockedUntil: string | null;
  updatedAt: string;
}

export interface BillingListItem {
  userId: string;
  email: string;
  role: "PATIENT" | "ADMIN";
  createdAt: string;
  tier: "FREE" | "PRO" | "PREMIUM";
  status: "ACTIVE" | "PAST_DUE" | "CANCELED" | "TRIALING" | "INCOMPLETE";
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
}

export interface BillingDetail {
  userId: string;
  email: string;
  tier: "FREE" | "PRO" | "PREMIUM";
  status: "ACTIVE" | "PAST_DUE" | "CANCELED" | "TRIALING" | "INCOMPLETE";
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
}

export interface TierBreakdownItem {
  tier: "FREE" | "PRO" | "PREMIUM";
  count: number;
}

export interface AnalyticsOverview {
  totalUsers: number;
  activeSubscriptions: number;
  tierBreakdown: TierBreakdownItem[];
  newUsersToday: number;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  role?: "PATIENT" | "ADMIN";
  tier?: "FREE" | "PRO" | "PREMIUM";
  status?: "ACTIVE" | "PAST_DUE" | "CANCELED" | "TRIALING" | "INCOMPLETE";
  search?: string;
}

export interface BillingListParams {
  page?: number;
  limit?: number;
  status?: "ACTIVE" | "PAST_DUE" | "CANCELED" | "TRIALING" | "INCOMPLETE";
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

// ─── Medical history ────────────────────────────────────────────────────────

export interface AllergyItem {
  id: string;
  name: string;
  reaction: string | null;
  severity: string | null;
  createdAt: string;
}

export interface ConditionItem {
  id: string;
  name: string;
  diagnosedYear: number | null;
  notes: string | null;
  createdAt: string;
}

export interface SurgeryItem {
  id: string;
  procedure: string;
  year: number | null;
  notes: string | null;
  createdAt: string;
}

export interface FamilyHistoryItem {
  id: string;
  relation: string;
  condition: string;
  createdAt: string;
}

export interface SocialHistoryRecord {
  id: string;
  smokingStatus: string | null;
  alcoholConsumption: string | null;
  exerciseLevel: string | null;
  [key: string]: unknown;
}

export interface MedicationItem {
  id: string;
  name: string;
  dose: string | null;
  frequency: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

export interface MedicalHistoryResponse {
  data: {
    allergies: AllergyItem[];
    pastConditions: ConditionItem[];
    surgeries: SurgeryItem[];
    familyHistory: FamilyHistoryItem[];
    socialHistory: SocialHistoryRecord | null;
    medications: MedicationItem[];
  };
}

// ─── Tracking ───────────────────────────────────────────────────────────────

export interface TrackingDashboard {
  symptomsLast30: number;
  avgSeverityLast30: number | null;
  mealsLast7: number;
  avgSleepHoursLast7: number | null;
  sleepLogsLast7: number;
  activeMedications: number;
  activeSupplements: number;
  latestWeight: { value: number; unit: string; recordedAt: string } | null;
}

export interface ScoreBreakdown {
  labs: number;
  labsMax: number;
  symptoms: number;
  symptomsMax: number;
  sleep: number;
  sleepMax: number;
  lifestyle: number;
  lifestyleMax: number;
  nutrition: number;
  nutritionMax: number;
}

export interface TrackingSummary {
  metabolicScore: number;
  scoreDelta: number;
  scoreBreakdown: ScoreBreakdown;
  alerts: unknown[];
  recentInsights: unknown[];
}

export interface TrackingResponse {
  dashboard: { data: TrackingDashboard };
  summary: { data: TrackingSummary };
}

// ─── Labs ───────────────────────────────────────────────────────────────────

export interface LabResultItem {
  id: string;
  markerName: string;
  value: number;
  unit: string;
  referenceRange: string | null;
  panelName: string | null;
  labName: string | null;
  flagged: boolean;
  collectedDate: string;
  documentId: string | null;
  createdAt: string;
}

export interface LabResultsResponse {
  data: LabResultItem[];
}

export interface LabsParams {
  from?: string;
  to?: string;
  marker?: string;
  limit?: number;
}

// ─── Documents ──────────────────────────────────────────────────────────────

export interface DocumentItem {
  id: string;
  docType: "LAB_REPORT" | "IMAGING" | "PRESCRIPTION" | "OTHER";
  originalFilename: string;
  mimeType: string;
  ocrStatus: "PENDING" | "PROCESSING" | "COMPLETE" | "FAILED";
  uploadedAt: string;
  downloadUrl: string;
}

export interface DocumentsResponse {
  data: DocumentItem[];
}

export interface DocsParams {
  docType?: "LAB_REPORT" | "IMAGING" | "PRESCRIPTION" | "OTHER";
}

// ─── User integrations ──────────────────────────────────────────────────────

export interface UserIntegration {
  provider: string;
  kind: string;
  configured: boolean;
  status: "CONNECTED" | "DISCONNECTED" | "ERROR" | "PENDING" | "NOT_CONNECTED";
  lastSyncedAt: string | null;
  errorMessage: string | null;
}

export interface UserIntegrationsResponse {
  data: UserIntegration[];
}

// ─── Audit logs ─────────────────────────────────────────────────────────────

export interface AuditLogItem {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  metadata: string | null;
}

export interface AuditLogParams {
  page?: number;
  limit?: number;
  action?: string;
  resourceType?: string;
  userId?: string;
  from?: string;
  to?: string;
}

// ─── Emergency events ───────────────────────────────────────────────────────

export type EmergencyEventType =
  | "ATRIAL_FIBRILLATION"
  | "VENTRICULAR_TACHYCARDIA"
  | "HYPOGLYCEMIA"
  | "HYPERGLYCEMIA_DKA";

export type EmergencyEventStatus = "DETECTED" | "ACKNOWLEDGED" | "DISMISSED";

export interface EmergencyEvent {
  id: string;
  userId: string;
  userEmail: string;
  type: EmergencyEventType;
  status: EmergencyEventStatus;
  value: number | null;
  unit: string | null;
  source: string | null;
  detectedAt: string;
  createdAt: string;
}

export interface EmergencyListParams {
  page?: number;
  limit?: number;
  status?: EmergencyEventStatus;
  type?: EmergencyEventType;
}

export interface EmergencyUpdateResponse {
  data: {
    id: string;
    status: EmergencyEventStatus;
    type: EmergencyEventType;
    detectedAt: string;
  };
}

// ─── Integrations summary ───────────────────────────────────────────────────

export interface IntegrationSummaryItem {
  provider: string;
  totalConnected: number;
  statusBreakdown: Record<string, number>;
  lastSyncedAt: string | null;
}

export interface IntegrationsSummaryResponse {
  data: IntegrationSummaryItem[];
}

// ─── Analytics time-series ──────────────────────────────────────────────────

export type AnalyticsRange = "7d" | "30d" | "90d" | "12m";

export interface GrowthBucket {
  date: string;
  count: number;
}

export interface GrowthResponse {
  data: {
    buckets: GrowthBucket[];
    totalInRange: number;
  };
}

export interface RevenueResponse {
  data: {
    currentMrr: number;
    currentArr: number;
    churnRate: number;
    buckets: { date: string; mrr: number }[];
    note: string;
  };
}

export interface AiUsageBucket {
  date: string;
  chat: number;
  labInterpret: number;
  nutrition: number;
  protocol: number;
  mealPhoto: number;
  interactions: number;
  total: number;
}

export interface AiUsageResponse {
  data: {
    buckets: AiUsageBucket[];
    totalInRange: number;
    tracked: boolean;
  };
}

export interface EngagementBucket {
  date: string;
  activeLoggers: number;
  symptoms: number;
  meals: number;
  sleep: number;
  supplements: number;
  medications: number;
}

export interface EngagementResponse {
  data: {
    buckets: EngagementBucket[];
    totalActiveInRange: number;
  };
}

export interface FunnelResponse {
  data: {
    registered: number;
    emailVerified: number;
    surveyComplete: number;
    firstLog: number;
    firstAiChat: number;
  };
}

// ─── Internal fetch helper ─────────────────────────────────────────────────

let isRefreshing = false;

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  skipAuth = false
): Promise<T> {
  const tokens = getTokens();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (!skipAuth && tokens) {
    headers["Authorization"] = `Bearer ${tokens.accessToken}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    toast.error("Connection error — check your network");
    throw new Error("Network error");
  }

  // Attempt token refresh once on 401
  if (res.status === 401 && !skipAuth && !isRefreshing) {
    const currentTokens = getTokens();
    if (currentTokens) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: currentTokens.refreshToken }),
        });

        if (refreshRes.ok) {
          const refreshData = (await refreshRes.json()) as LoginResponse;
          setTokens({
            accessToken: refreshData.accessToken,
            refreshToken: refreshData.refreshToken,
          });
          isRefreshing = false;

          // Retry original request with new token
          const retryHeaders = {
            ...headers,
            Authorization: `Bearer ${refreshData.accessToken}`,
          };
          const retryRes = await fetch(`${API_BASE}${path}`, {
            ...options,
            headers: retryHeaders,
          });

          if (!retryRes.ok) {
            clearTokens();
            window.location.href = "/login";
            throw new Error("Session expired");
          }

          return retryRes.json() as Promise<T>;
        }
      } catch {
        // fall through
      }

      isRefreshing = false;
      clearTokens();
      window.location.href = "/login";
      throw new Error("Session expired");
    }
  }

  if (res.status === 403) {
    toast.error("Access denied");
    throw new Error("Access denied");
  }

  if (!res.ok) {
    let message = "Request failed";
    try {
      const body = (await res.json()) as { error?: { message?: string }; message?: string };
      message = body?.error?.message ?? body?.message ?? message;
    } catch {
      // ignore parse errors
    }
    const err = Object.assign(new Error(message), { status: res.status });
    throw err;
  }

  // 204 No Content
  if (res.status === 204) return undefined as unknown as T;

  return res.json() as Promise<T>;
}

function buildQuery(params: Record<string, unknown>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      q.set(k, String(v));
    }
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

// ─── Exported API client ───────────────────────────────────────────────────

export const api = {
  auth: {
    login(email: string, password: string): Promise<LoginResponse> {
      return apiFetch<LoginResponse>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }, true);
    },

    refresh(refreshToken: string): Promise<LoginResponse> {
      return apiFetch<LoginResponse>("/api/v1/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      }, true);
    },

    logout(): Promise<void> {
      const tokens = getTokens();
      return apiFetch<void>("/api/v1/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken: tokens?.refreshToken }),
      });
    },
  },

  admin: {
    users: {
      list(params: UserListParams = {}): Promise<PaginatedResponse<UserListItem>> {
        return apiFetch<PaginatedResponse<UserListItem>>(
          `/api/v1/admin/users${buildQuery(params as Record<string, unknown>)}`
        );
      },

      get(id: string): Promise<UserDetail> {
        return apiFetch<UserDetail>(`/api/v1/admin/users/${id}`);
      },

      update(id: string, body: UpdateUserBody): Promise<UserUpdateResponse> {
        return apiFetch<UserUpdateResponse>(`/api/v1/admin/users/${id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      },

      delete(id: string): Promise<void> {
        return apiFetch<void>(`/api/v1/admin/users/${id}`, {
          method: "DELETE",
        });
      },

      getMedicalHistory(id: string): Promise<MedicalHistoryResponse> {
        return apiFetch<MedicalHistoryResponse>(`/api/v1/admin/users/${id}/medical-history`);
      },

      getTracking(id: string): Promise<TrackingResponse> {
        return apiFetch<TrackingResponse>(`/api/v1/admin/users/${id}/tracking`);
      },

      getLabs(id: string, params: LabsParams = {}): Promise<LabResultsResponse> {
        return apiFetch<LabResultsResponse>(
          `/api/v1/admin/users/${id}/labs${buildQuery(params as Record<string, unknown>)}`
        );
      },

      getDocuments(id: string, params: DocsParams = {}): Promise<DocumentsResponse> {
        return apiFetch<DocumentsResponse>(
          `/api/v1/admin/users/${id}/documents${buildQuery(params as Record<string, unknown>)}`
        );
      },

      getIntegrations(id: string): Promise<UserIntegrationsResponse> {
        return apiFetch<UserIntegrationsResponse>(`/api/v1/admin/users/${id}/integrations`);
      },
    },

    billing: {
      list(params: BillingListParams = {}): Promise<PaginatedResponse<BillingListItem>> {
        return apiFetch<PaginatedResponse<BillingListItem>>(
          `/api/v1/admin/billing${buildQuery(params as Record<string, unknown>)}`
        );
      },

      get(userId: string): Promise<BillingDetail> {
        return apiFetch<BillingDetail>(`/api/v1/admin/billing/${userId}`);
      },
    },

    auditLogs: {
      list(params: AuditLogParams = {}): Promise<PaginatedResponse<AuditLogItem>> {
        return apiFetch<PaginatedResponse<AuditLogItem>>(
          `/api/v1/admin/audit-logs${buildQuery(params as Record<string, unknown>)}`
        );
      },
    },

    emergency: {
      list(params: EmergencyListParams = {}): Promise<PaginatedResponse<EmergencyEvent>> {
        return apiFetch<PaginatedResponse<EmergencyEvent>>(
          `/api/v1/admin/emergency/events${buildQuery(params as Record<string, unknown>)}`
        );
      },

      acknowledge(id: string): Promise<EmergencyUpdateResponse> {
        return apiFetch<EmergencyUpdateResponse>(`/api/v1/admin/emergency/events/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: "ACKNOWLEDGED" }),
        });
      },

      dismiss(id: string): Promise<EmergencyUpdateResponse> {
        return apiFetch<EmergencyUpdateResponse>(`/api/v1/admin/emergency/events/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: "DISMISSED" }),
        });
      },
    },

    integrations: {
      summary(): Promise<IntegrationsSummaryResponse> {
        return apiFetch<IntegrationsSummaryResponse>("/api/v1/admin/integrations/summary");
      },
    },

    analytics: {
      overview(): Promise<AnalyticsOverview> {
        return apiFetch<AnalyticsOverview>("/api/v1/admin/analytics/overview");
      },

      growth(range: AnalyticsRange = "30d"): Promise<GrowthResponse> {
        return apiFetch<GrowthResponse>(`/api/v1/admin/analytics/growth?range=${range}`);
      },

      revenue(range: AnalyticsRange = "30d"): Promise<RevenueResponse> {
        return apiFetch<RevenueResponse>(`/api/v1/admin/analytics/revenue?range=${range}`);
      },

      aiUsage(range: AnalyticsRange = "30d"): Promise<AiUsageResponse> {
        return apiFetch<AiUsageResponse>(`/api/v1/admin/analytics/ai-usage?range=${range}`);
      },

      engagement(range: AnalyticsRange = "30d"): Promise<EngagementResponse> {
        return apiFetch<EngagementResponse>(`/api/v1/admin/analytics/engagement?range=${range}`);
      },

      funnel(): Promise<FunnelResponse> {
        return apiFetch<FunnelResponse>("/api/v1/admin/analytics/funnel");
      },
    },
  },
};

// Keep the existing authApi export for the auth pages that use it (forgot-password, reset-password, verify-email)
export const authApi = {
  forgotPassword: (email: string) =>
    apiFetch<{ message: string }>("/api/v1/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }, true),

  resetPassword: (token: string, newPassword: string) =>
    apiFetch<{ message: string }>("/api/v1/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    }, true),

  verifyEmail: (token: string) =>
    apiFetch<{ message: string }>("/api/v1/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    }, true),
};
