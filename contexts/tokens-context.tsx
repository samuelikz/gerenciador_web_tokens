"use client";

import * as React from "react";
import { toast } from "sonner";

// =======================================================
// MOCK de useRole para resolver erro de importação
// =======================================================
// No ambiente real, esta função seria importada de outro arquivo.
// O tipo 'Role' pode ser estendido se necessário.
type Role = "USER" | "ADMIN" | "GUEST" | null; 
const useRole = (): Role => {
    // Simula o papel (role) do usuário. Defina aqui o papel desejado para testes.
    // Exemplo: 'ADMIN' para testar a funcionalidade de administrador, ou 'USER'.
    return "ADMIN"; 
};
// =======================================================

export type ApiToken = {
  id: string;
  userId: string;
  createdByUserId: string;
  scope: string;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  revokedAt: string | null;
  description: string | null;
  createdByName: string | null;
  createdByEmail: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
};
type ApiErrorShape =
  | { error?: { message?: string } }
  | { message?: string }
  | Record<string, unknown>;
type ListResp = {
  success?: boolean;
  data?: ApiToken[];
  items?: ApiToken[];
} & ApiErrorShape;
type CreateResp = {
  success?: boolean;
  data?: { token: ApiToken; apiKey: string };
  token?: ApiToken;
  apiKey?: string;
} & ApiErrorShape;

function getErrorMessage(err: unknown, fallback = "Ocorreu um erro"): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return fallback;
}
async function readJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
function extractApiMessage(body: unknown): string | null {
  if (body && typeof body === "object") {
    const maybe = body as Record<string, unknown>;
    const nested = maybe.error as { message?: string } | undefined;
    if (nested?.message) return nested.message;
    const msg = maybe.message;
    if (typeof msg === "string") return msg;
  }
  return null;
}

type TokensContextType = {
  myTokens: ApiToken[];
  othersTokens: ApiToken[];
  loadingMine: boolean;
  loadingOthers: boolean;
  load: () => Promise<void>;
  loadAll: () => Promise<void>;
  refreshAll: () => Promise<void>;
  revokeToken: (tokenId: string) => Promise<void>;
  createToken: (payload: {
    scope: string;
    expiresAt: string | null;
    description: string | null;
  }) => Promise<{ apiKey: string; token: ApiToken } | null>;
};

const TokensContext = React.createContext<TokensContextType | undefined>(
  undefined
);

export function TokensProvider({ children }: { children: React.ReactNode }) {
  const role = useRole();
  const isAdmin = role === "ADMIN";

  const [myTokens, setMyTokens] = React.useState<ApiToken[]>([]);
  const [othersTokens, setOthersTokens] = React.useState<ApiToken[]>([]);
  const [loadingMine, setLoadingMine] = React.useState(false);
  const [loadingOthers, setLoadingOthers] = React.useState(false);

  // 1. load (Carrega apenas os tokens do usuário logado)
  const load = React.useCallback(async () => {
    setLoadingMine(true);
    try {
      const res = await fetch("/api/tokens", {
        method: "GET",
        cache: "no-store",
      });
      const body = await readJson<ListResp>(res);
      if (!res.ok || body?.success === false)
        throw new Error(extractApiMessage(body) ?? "Falha ao carregar tokens");

      const list: ApiToken[] = Array.isArray(body?.data)
        ? body.data!
        : Array.isArray(body?.items)
          ? body.items!
          : [];
      setMyTokens(list);
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao buscar tokens"));
    } finally {
      setLoadingMine(false);
    }
  }, []); // Dependências mínimas

  // 2. loadAll (Carrega tokens de todos os usuários - Apenas Admin)
  const loadAll = React.useCallback(async () => {
    // Não precisamos checar isAdmin e loadingOthers aqui, 
    // pois o useEffect que o chama já fará essa verificação de role.
    setLoadingOthers(true);
    try {
      const res = await fetch("/api/tokensall", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });
      const body = await readJson<ListResp>(res);
      if (!res.ok || body?.success === false)
        throw new Error(extractApiMessage(body) ?? "Falha ao carregar tokens");
      const list: ApiToken[] = Array.isArray(body?.data)
        ? body!.data!
        : Array.isArray(body?.items)
          ? body!.items!
          : [];
      setOthersTokens(list);
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao buscar tokens (Admin)"));
    } finally {
      setLoadingOthers(false);
    }
  }, []); // Dependências mínimas

  // 3. refreshAll (Função que recarrega todos os dados)
  // Depende de load, loadAll e isAdmin
  const refreshAll = React.useCallback(async () => {
    await load();
    if (isAdmin) await loadAll();
  }, [load, loadAll, isAdmin]);

  // =======================================================
  // 4. SEPARAÇÃO DOS EFEITOS DE CARREGAMENTO
  // =======================================================

  // Efeito 1: Carrega os tokens do usuário (sempre)
  React.useEffect(() => {
    if (role) { // Garante que só carrega após o role ser definido (ou seja, autenticado)
        load();
    }
  }, [role, load]);

  // Efeito 2: Carrega os tokens de todos os usuários (apenas Admin)
  React.useEffect(() => {
    if (role === "ADMIN") {
      loadAll();
    }
  }, [role, loadAll]);


  // 5. Funções de Ação (Mantidas as chamadas para refreshAll)
  async function revokeToken(tokenId: string) {
    try {
      const res = await fetch("/api/tokens", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId }),
      });
      const body = await readJson<ApiErrorShape & { success?: boolean }>(res);
      if (!res.ok || body?.success === false)
        throw new Error(extractApiMessage(body) ?? "Falha ao revogar token");
      toast.success("Token revogado");
      // Atualiza os dados após a ação
      await refreshAll(); 
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao revogar"));
    }
  }

  async function createToken(payload: {
    scope: string;
    expiresAt: string | null;
    description: string | null;
  }) {
    try {
      const res = await fetch("/api/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await readJson<CreateResp>(res);
      if (!res.ok || !body)
        throw new Error(extractApiMessage(body) ?? "Erro ao criar token");
      const apiKey = body.data?.apiKey ?? body.apiKey ?? "";
      const token = body.data?.token ?? body.token;
      if (token && apiKey) {
        // Atualiza os dados após a ação
        await refreshAll(); 
        return { apiKey, token };
      }
      return null;
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao criar token"));
      return null;
    }
  }

  return (
    <TokensContext.Provider
      value={{
        myTokens,
        othersTokens,
        loadingMine,
        loadingOthers,
        load,
        loadAll,
        refreshAll,
        revokeToken,
        createToken,
      }}
    >
      {children}
    </TokensContext.Provider>
  );
}

export function useTokens() {
  const ctx = React.useContext(TokensContext);
  if (!ctx)
    throw new Error("useTokens deve ser usado dentro de TokensProvider");
  return ctx;
}
