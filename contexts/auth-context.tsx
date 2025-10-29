"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserData } from "@/types/user";

type AuthContextType = {
  user: UserData | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  reloadUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  async function reloadUser() {
    try {
      const res = await fetch("/api/users/me/profile", { credentials: "include" });
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

  useEffect(() => {
    reloadUser();
  }, []);

  async function login(token: string) {
    localStorage.setItem("token", token);
    await reloadUser();
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, reloadUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
