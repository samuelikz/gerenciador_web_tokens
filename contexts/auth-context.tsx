"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

// 1. MOCK DE USERDATA (Substituindo a import @/types/user)
// Adicionando a propriedade 'active' que estava faltando para o LoginForm
export type UserData = {
    id: string;
    name: string;
    email: string;
    isActive: boolean; // <-- Propriedade necessária
    // Adicione outros campos do usuário aqui (ex: role)
    role?: string;
};


type AuthApiLoginResponse = { token: string } & Record<string, unknown>;

// 2. TIPO DE LOGIN ATUALIZADO
// A função login agora retorna o usuário logado ou nulo
type LoginFn = (email: string, password: string) => Promise<UserData | null>;

type AuthContextType = {
    user: UserData | null;
    loading: boolean;
    token: string | null;
    login: LoginFn;
    logout: () => void;
    reloadUser: () => Promise<UserData | null>; // Tipo de retorno atualizado
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);

    // 3. RELOADUSER ATUALIZADO
    // Agora retorna o usuário ou nulo, e usa o 'token' do estado.
    const reloadUser = useCallback(async () => {
        if (!token) {
            setLoading(false);
            setUser(null);
            return null;
        }

        setLoading(true); // Garante que o loading esteja ativo durante o reload
        try {
            const res = await fetch("/api/users/me/profile", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error("Não autorizado");

            const data = await res.json();
            if (data.success && data.data) {
                const userData = data.data as UserData;
                setUser(userData);
                return userData; // <-- Retorna o usuário
            } else {
                setUser(null);
                return null; // <-- Retorna nulo
            }
        } catch {
            setUser(null);
            setToken(null); // Limpa o token se o reload falhar
            localStorage.removeItem("token");
            return null; // <-- Retorna nulo
        } finally {
            setLoading(false);
        }
    }, [token]); // Depende do token no estado

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

    // 4. FUNÇÃO LOGIN ATUALIZADA
    // Agora valida o status 'active' ANTES de salvar o token
    const login = useCallback(async (email: string, password: string) => {
        // 1. Autentica e obtém o token
        const newToken = await apiLogin(email, password);
        console.log("sla")

        setLoading(true);
        try {
            // 2. Busca os dados do usuário COM o novo token
            const res = await fetch("/api/users/me/profile", {
                headers: { Authorization: `Bearer ${newToken}` }, // Usa o novo token
            });
            if (!res.ok) throw new Error("Não autorizado");
            const data = await res.json();
            if (data.success && data.data) {
                const userData = data.data as UserData;

                console.log("DADOS DO USUÁRIO RECEBIDO:", userData)

                // 3. VALIDAÇÃO DE USUÁRIO ATIVO
                if (userData.isActive === false) {
                    // Se o usuário está inativo, rejeita o login
                    // Não salva token, não salva usuário
                    console.log("sla")
                    logout()
                    throw new Error("Usuário inativo. Entre em contato com o suporte.");
                }

                // 4. Usuário ativo, salva a sessão
                localStorage.setItem("token", newToken);
                setToken(newToken); // Define o token no estado
                setUser(userData);
                return userData; // Retorna o usuário para o LoginForm
            }
            throw new Error("Usuário não encontrado após login.");

        } catch (err) {
            // 5. Garante que, se a validação ou o fetch falhar, nenhum estado
            // de login persista
            setUser(null);
            setToken(null);
            localStorage.removeItem("token");
            throw err; // Lança o erro (ex: "Usuário inativo") para o LoginForm tratar
        } finally {
            setLoading(false);
        }
    }, []); // Removida a dependência [reloadUser]

    // 5. USEEFFECT ATUALIZADO
    // Carrega o usuário se um token for encontrado na inicialização.
    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            setToken(storedToken);
            // Chama o reloadUser com o token encontrado
            async function loadInitialUser() {
                setLoading(true);
                try {
                    const res = await fetch("/api/users/me/profile", {
                        headers: { Authorization: `Bearer ${storedToken}` },
                    });
                    if (!res.ok) throw new Error("Sessão expirada");
                    const data = await res.json();
                    if (data.success && data.data) {
                        // VERIFICAÇÃO INICIAL: Também verifica se o usuário salvo está ativo
                        const userData = data.data as UserData;
                        if (userData.isActive === false) {
                            throw new Error("Usuário inativo.");
                        }
                        setUser(userData);

                    } else {
                        throw new Error("Falha ao carregar sessão");
                    }
                } catch {
                    // Se o usuário salvo estiver inativo ou a sessão expirar, limpa
                    localStorage.removeItem("token");
                    setToken(null);
                    setUser(null);
                } finally {
                    setLoading(false);
                }
            }
            loadInitialUser();
        } else {
            // Se não há token, paramos o carregamento
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

