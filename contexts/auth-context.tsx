"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type UserData = {
    id: string;
    name: string;
    email: string;
    isActive: boolean; 
    role?: string;
};


type AuthApiLoginResponse = { token: string } & Record<string, unknown>;

type LoginFn = (email: string, password: string) => Promise<UserData | null>;

type AuthContextType = {
    user: UserData | null;
    loading: boolean;
    token: string | null;
    login: LoginFn;
    logout: () => void;
    reloadUser: () => Promise<UserData | null>; 
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);

    const reloadUser = useCallback(async () => {
        if (!token) {
            setLoading(false);
            setUser(null);
            return null;
        }

        setLoading(true); 
        try {
            const res = await fetch("/api/users/me/profile", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error("Não autorizado");

            const data = await res.json();
            if (data.success && data.data) {
                const userData = data.data as UserData;
                setUser(userData);
                return userData; 
            } else {
                setUser(null);
                return null; 
            }
        } catch {
            logout(); 
            return null;
        } finally {
            setLoading(false);
        }
    }, [token]); 
    const logout = useCallback(() => {
        localStorage.removeItem("token");
        setUser(null);
        setToken(null);
    }, []);


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

    const login = useCallback(async (email: string, password: string) => {
        const newToken = await apiLogin(email, password);

        setLoading(true);
        try {
            const res = await fetch("/api/users/me/profile", {
                headers: { Authorization: `Bearer ${newToken}` }, // Usa o novo token
            });
            if (!res.ok) throw new Error("Não autorizado");
            const data = await res.json();
            if (data.success && data.data) {
                const userData = data.data as UserData;

                if (userData.isActive === false) {
                    await fetch("/api/auth/logout", {
                        method: "POST",
                        credentials: "include",
                    });
                    throw new Error("Usuário inativo. Entre em contato com o suporte.");
                }

                localStorage.setItem("token", newToken);
                setToken(newToken); // Define o token no estado
                setUser(userData);
                return userData; // Retorna o usuário para o LoginForm
            }
            throw new Error("Usuário não encontrado após login.");

        } catch (err) {
            setUser(null);
            setToken(null);
            localStorage.removeItem("token");
            throw err; // Lança o erro (ex: "Usuário inativo") para o LoginForm tratar
        } finally {
            setLoading(false);
        }
    }, []); // Removida a dependência [reloadUser]

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            setToken(storedToken);
            async function loadInitialUser() {
                setLoading(true);
                try {
                    const res = await fetch("/api/users/me/profile", {
                        headers: { Authorization: `Bearer ${storedToken}` },
                    });
                    if (!res.ok) throw new Error("Sessão expirada");
                    const data = await res.json();
                    if (data.success && data.data) {
                        const userData = data.data as UserData;
                        if (userData.isActive === false) {
                            throw new Error("Usuário inativo.");
                        }
                        setUser(userData);

                    } else {
                        throw new Error("Falha ao carregar sessão");
                    }
                } catch {
                    localStorage.removeItem("token");
                    setToken(null);
                    setUser(null);
                } finally {
                    setLoading(false);
                }
            }
            loadInitialUser();
        } else {
            setLoading(false);
        }
    }, []); // Roda apenas uma vez


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

