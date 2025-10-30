"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRole } from "@/contexts/role-context";
import { useUsers } from "@/contexts/user-context";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import {
  IconPlus,
  IconSearch,
  IconReload,
  IconDotsVertical,
} from "@tabler/icons-react";

type CreateUserForm = {
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  password: string;
};

export default function UsersClientPage() {
  const myRole = useRole();
  const isAdmin = myRole === "ADMIN";
  const {
    users,
    loading,
    loaded,
    refresh,
    createUser,
    toggleActive,
    changeRole,
  } = useUsers();

  const [query, setQuery] = React.useState("");
  const [openCreate, setOpenCreate] = React.useState(false);
  const [creating, setCreating] = React.useState(false);

  // Estado do formulário tipado
  const [form, setForm] = React.useState<CreateUserForm>({
    name: "",
    email: "",
    role: "USER",
    password: "",
  });

  const filtered = React.useMemo(() => {
    if (!query.trim()) return users;
    const q = query.toLowerCase();
    return users.filter(
      (u) =>
        (u.name ?? "").toLowerCase().includes(q) ||
        (u.email ?? "").toLowerCase().includes(q) ||
        (u.role ?? "").toLowerCase().includes(q)
    );
  }, [users, query]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin)
      return toast.error("Apenas administradores podem criar usuários.");
    if (!form.name.trim()) return toast.error("Nome é obrigatório.");
    if (!/.+@.+\..+/.test(form.email)) return toast.error("E-mail inválido.");
    if (form.password.length < 6)
      return toast.error("Senha mínima: 6 caracteres.");

    try {
      setCreating(true);
      await createUser(form);
      setOpenCreate(false);
      setForm({ name: "", email: "", role: "USER", password: "" });
    } finally {
      setCreating(false);
    }
  }

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleFormInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setForm((f) => ({ ...f, [id]: value }));
  };

  const handleFormRoleChange = (v: string) => {
    if (v === "USER" || v === "ADMIN") {
      setForm((f) => ({ ...f, role: v as "USER" | "ADMIN" }));
    }
  };

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-semibold">Usuários</h2>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              className="pl-8 w-64"
              placeholder="Buscar por nome, e-mail ou papel…"
              value={query}
              onChange={handleQueryChange}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={refresh}
            disabled={loading}
          >
            <IconReload
              className={loading ? "size-4 animate-spin" : "size-4"}
            />
          </Button>

          {isAdmin && (
            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
              <DialogTrigger asChild>
                <Button>
                  <IconPlus className="mr-2 size-4" /> Novo usuário
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Criar novo usuário</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="grid gap-4">
                  <div>
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={handleFormInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={handleFormInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Papel</Label>
                    <Select
                      value={form.role}
                      onValueChange={handleFormRoleChange}
                    >
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Selecione o papel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER">USER</SelectItem>
                        <SelectItem value="ADMIN">ADMIN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={form.password}
                      // Corrigido para usar o handler tipado
                      onChange={handleFormInputChange}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpenCreate(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={creating}>
                      {creating ? "Criando..." : "Criar usuário"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Lista</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden sm:table-cell">E-mail</TableHead>
                  <TableHead className="hidden md:table-cell">Papel</TableHead>
                  <TableHead className="hidden lg:table-cell">Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Usando a variável 'filtered' para a lista */}
                {filtered.length ? (
                  filtered.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>{u.name}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {u.email}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">{u.role}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {u.isActive ? (
                          <Badge variant="outline">Ativo</Badge>
                        ) : (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                            >
                              <IconDotsVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                changeRole(
                                  u,
                                  u.role === "ADMIN" ? "USER" : "ADMIN"
                                )
                              }
                            >
                              {u.role === "ADMIN"
                                ? "Rebaixar p/ USER"
                                : "Promover a ADMIN"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => toggleActive(u)}>
                              {u.isActive ? "Desativar" : "Ativar"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground"
                    >
                      {loaded ? "Nada encontrado" : "Carregando…"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

