"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserData } from "@/types/user";

type AuthApiLoginResponse = { token: string } & Record<string, unknown>;
type LoginFn = (email: string, password: string) => Promise<void>;

type AuthContextType = {
  user: UserData | null;
  loading: boolean;
  token: string | null;
  login: LoginFn;
  logout: () => void;
  reloadUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  async function reloadUser() {
    try {
      const storedToken = localStorage.getItem("token");
      if (!storedToken) throw new Error("Sem token");

      const res = await fetch("/api/users/me/profile", {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      if (!res.ok) throw new Error("Não autorizado");

      const data = await res.json();
      if (data.success) {
        setUser(data.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
  }


  async function apiLogin(email: string, password: string) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    
    if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ message: "Erro de rede ou servidor." }));
        throw new Error(errorBody.message || "Falha na autenticação.");
    }
    
    const data: AuthApiLoginResponse = await res.json();
    return data.token; 
  }

  async function login(email: string, password: string) {
    const newToken = await apiLogin(email, password); 
    
    localStorage.setItem("token", newToken); 
    
    setToken(newToken);
    await reloadUser(); 
  }

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) setToken(storedToken);
    reloadUser();
  }, []);


  return (
    <AuthContext.Provider
      value={{ user, loading, token, login, logout, reloadUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
