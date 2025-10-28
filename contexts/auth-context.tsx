"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { setCookie, getCookie, deleteCookie } from "cookies-next";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  email: string;
  name?: string;
  role?: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Carrega token e perfil ao iniciar
  useEffect(() => {
    const t = getCookie("accessToken") as string | undefined;
    if (t) {
      setToken(t);
      fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${t}` },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => setUser(data?.user ?? null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email: string, password: string) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const body = await res.json();
    if (!res.ok || body?.success === false) {
      throw new Error(body?.message || "Falha no login");
    }

    const { token: newToken, user } = body;
    setUser(user);
    setToken(newToken);
    setCookie("accessToken", newToken, { path: "/", maxAge: 60 * 60 * 24 });
    router.replace("/dashboard");
    router.refresh();
  }

  function logout() {
    deleteCookie("accessToken");
    setUser(null);
    setToken(null);
    router.replace("/login");
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
