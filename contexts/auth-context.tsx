"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface User {
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Carrega dados salvos do localStorage
  useEffect(() => {
    const stored = localStorage.getItem("auth");
    if (stored) {
      try {
        const { token, user } = JSON.parse(stored);
        setToken(token);
        setUser(user);
      } catch (err) {
        console.error("Erro ao carregar auth:", err);
      }
    }
    setLoading(false);
  }, []);

  // 🔹 Persiste automaticamente
  useEffect(() => {
    if (token && user) {
      localStorage.setItem("auth", JSON.stringify({ token, user }));
    } else {
      localStorage.removeItem("auth");
    }
  }, [token, user]);

  // 🔹 Função de login real
  async function login(email: string, password: string) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok || !data?.success) {
      throw new Error(data?.message || "Falha no login");
    }

    // Supondo que a API retorne { token, user: { name, email, role } }
    const { token, user } = data;

    setToken(token);
    setUser(user);

    localStorage.setItem("auth", JSON.stringify({ token, user }));
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem("auth");
  }

  const isAuthenticated = !!token && !!user;

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  return ctx;
}
