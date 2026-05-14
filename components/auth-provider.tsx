"use client";

import * as React from "react";

export type AdminUser = {
  name: string;
  email: string;
  role: string;
  avatarColor: string;
};

type AuthContextValue = {
  user: AdminUser | null;
  isReady: boolean;
  login: (email: string) => void;
  logout: () => void;
};

const STORAGE_KEY = "metaiq.admin.session";

const AuthContext = React.createContext<AuthContextValue | null>(null);

function deriveUser(email: string): AdminUser {
  const handle = email.split("@")[0] || "admin";
  const name = handle
    .split(/[._-]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
  return {
    name: name || "Admin User",
    email,
    role: "Administrator",
    avatarColor: "#0f766e",
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AdminUser | null>(null);
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // ignore corrupt session
    }
    setIsReady(true);
  }, []);

  const login = React.useCallback((email: string) => {
    const next = deriveUser(email.trim().toLowerCase());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setUser(next);
  }, []);

  const logout = React.useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isReady, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
