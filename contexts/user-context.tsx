"use client";

import * as React from "react";
import { toast } from "sonner";

export type Role = "ADMIN" | "USER";

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type ListResp = {
  success?: boolean;
  data?: ApiUser[];
  items?: ApiUser[];
};

type CreateResp = { success?: boolean; data?: ApiUser };
type UpdateResp = { success?: boolean; data?: ApiUser };

type UserContextValue = {
  users: ApiUser[];
  loading: boolean;
  loaded: boolean;
  refresh: () => Promise<void>;
  createUser: (user: { name: string; email: string; role: Role; password: string }) => Promise<void>;
  toggleActive: (user: ApiUser) => Promise<void>;
  changeRole: (user: ApiUser, role: Role) => Promise<void>;
};

const UserContext = React.createContext<UserContextValue | undefined>(undefined);

async function readJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = React.useState<ApiUser[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users", { method: "GET", cache: "no-store" });
      const body = await readJson<ListResp>(res);
      console.log(res)

      if (!res.ok || body?.success === false) throw new Error("Falha ao carregar usuários");

      const list = body?.data ?? body?.items ?? [];
      setUsers(list);
      setLoaded(true);
    } catch {
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  async function createUser(user: { name: string; email: string; role: Role; password: string }) {
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });

      const body = await readJson<CreateResp>(res);
      if (!res.ok || body?.success === false) throw new Error("Falha ao criar usuário");

      toast.success("Usuário criado");
      refresh();
    } catch {
      toast.error("Erro ao criar usuário");
    }
  }

  async function toggleActive(user: ApiUser) {
    try {
      const res = await fetch(`/api/users/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      console.log(res)
      const body = await readJson<UpdateResp>(res);
      if (!res.ok || body?.success === false) throw new Error("Erro ao alterar status");
      toast.success(user.isActive ? "Usuário desativado" : "Usuário ativado");
      refresh();
    } catch {
      toast.error("Erro ao alterar status");
    }
  }

  async function changeRole(user: ApiUser, role: Role) {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      console.log(res)
      const body = await readJson<UpdateResp>(res);
      if (!res.ok || body?.success === false) throw new Error("Erro ao alterar papel");
      toast.success(`Papel alterado para ${role}`);
      refresh();
    } catch {
      toast.error("Erro ao alterar papel");
    }
  }

  return (
    <UserContext.Provider
      value={{ users, loading, loaded, refresh, createUser, toggleActive, changeRole }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUsers() {
  const ctx = React.useContext(UserContext);
  if (!ctx) throw new Error("useUsers deve ser usado dentro de <UserProvider>");
  return ctx;
}
