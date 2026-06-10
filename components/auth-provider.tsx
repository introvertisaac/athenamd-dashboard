"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, decodeJwt } from "@/lib/api";
import { clearTokens, setTokens } from "@/lib/auth";

export type AdminUser = {
  name: string;
  email: string;
  role: string;
  avatarColor: string;
};

type AuthContextValue = {
  user: AdminUser | null;
  isReady: boolean;
  clinicalAccess: boolean;
  setClinicalAccess: (v: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

function deriveUser(email: string, role: string): AdminUser {
  const handle = email.split("@")[0] || "admin";
  const name = handle
    .split(/[._-]/)
    .map((p: string) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
  return {
    name: name || "Admin User",
    email,
    role,
    avatarColor: "#0f766e",
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = React.useState<AdminUser | null>(null);
  const [clinicalAccess, setClinicalAccessState] = React.useState(false);
  // Tokens are memory-only — no storage to hydrate from, so isReady is true immediately
  const [isReady] = React.useState(true);

  const login = React.useCallback(
    async (email: string, password: string): Promise<void> => {
      const res = await api.auth.login(email.trim().toLowerCase(), password);
      const payload = decodeJwt(res.accessToken);
      if (payload.role !== "ADMIN") {
        throw new Error("Admin access required");
      }
      setTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken });
      setUser(deriveUser(email.trim().toLowerCase(), payload.role));
    },
    []
  );

  const logout = React.useCallback(async (): Promise<void> => {
    try {
      await api.auth.logout();
    } catch {
      // best-effort — clear tokens regardless
    }
    clearTokens();
    setUser(null);
    router.replace("/login");
  }, [router]);

  const setClinicalAccess = React.useCallback((v: boolean) => {
    setClinicalAccessState(v);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isReady,
        clinicalAccess,
        setClinicalAccess,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
