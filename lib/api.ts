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
}

export interface PaginationParams {
  page?: number;
  limit?: number;
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
    },

    billing: {
      list(params: PaginationParams = {}): Promise<PaginatedResponse<BillingListItem>> {
        return apiFetch<PaginatedResponse<BillingListItem>>(
          `/api/v1/admin/billing${buildQuery(params as Record<string, unknown>)}`
        );
      },

      get(userId: string): Promise<BillingDetail> {
        return apiFetch<BillingDetail>(`/api/v1/admin/billing/${userId}`);
      },
    },

    analytics: {
      overview(): Promise<AnalyticsOverview> {
        return apiFetch<AnalyticsOverview>("/api/v1/admin/analytics/overview");
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
