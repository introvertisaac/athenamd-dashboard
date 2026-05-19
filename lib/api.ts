const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      (data as { message?: string }).message ?? "Request failed"
    );
  }
  return data as T;
}

export const authApi = {
  forgotPassword: (email: string) =>
    post<{ message: string }>("/api/v1/auth/forgot-password", { email }),

  resetPassword: (token: string, newPassword: string) =>
    post<{ message: string }>("/api/v1/auth/reset-password", {
      token,
      newPassword,
    }),

  verifyEmail: (token: string) =>
    post<{ message: string }>("/api/v1/auth/verify-email", { token }),
};
