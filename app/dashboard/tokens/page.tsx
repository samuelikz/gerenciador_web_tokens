"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRole } from "@/contexts/role-context";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  IconDownload,
  IconClipboard,
} from "@tabler/icons-react";
import TokenList from "@/components/TokenList";

type ApiToken = {
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

const isAtivo = (t: ApiToken) => !!(t.isActive && !t.revokedAt);
const toMs = (d?: string | null) => (d ? new Date(d).getTime() : 0);

// Usa FIM do dia (23:59:59.999Z) para aceitar “hoje”
const toIsoZ = (dateStr?: string) => {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T23:59:59.999Z`);
  return d.toISOString();
};

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

export default function TokensPage() {
  const role = useRole();
  const isAdmin = role === "ADMIN"; // tabela

  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [myTokens, setMyTokens] = React.useState<ApiToken[]>([]);
  const [othersTokens, setOthersTokens] = React.useState<ApiToken[]>([]);
  const [loadingMine, setLoadingMine] = React.useState(false);
  const [loadingOthers, setLoadingOthers] = React.useState(false); // criar

  const [openCreate, setOpenCreate] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [scope, setScope] = React.useState<string>("READ");
  const [expiresDate, setExpiresDate] = React.useState<string>("");
  const [description, setDescription] = React.useState<string>(""); // resultado

  const [openResult, setOpenResult] = React.useState(false);
  const [apiKey, setApiKey] = React.useState<string>("");
  const [createdPayload, setCreatedPayload] = React.useState<{
    token: ApiToken;
    apiKey: string;
  } | null>(null); // hoje (AAAA-MM-DD) para bloquear datas passadas no input

  const todayStr = React.useMemo(
    () => new Date().toISOString().slice(0, 10),
    []
  );

  const load = React.useCallback(async () => {
    setLoadingMine(true);
    try {
      const res = await fetch("/api/tokens", {
        method: "GET",
        cache: "no-store",
      });
      const body = await readJson<ListResp>(res);

      if (!res.ok || body?.success === false) {
        throw new Error(extractApiMessage(body) ?? "Falha ao carregar tokens");
      } // aceita { data } OU { items }

      const list: ApiToken[] = Array.isArray(body?.data)
        ? body!.data!
        : Array.isArray(body?.items)
        ? body!.items!
        : []; // normaliza campos de data para string|null

      const norm = list.map((t) => ({
        ...t,
        createdAt: typeof t.createdAt === "string" ? t.createdAt : null,
        expiresAt: typeof t.expiresAt === "string" ? t.expiresAt : null,
        revokedAt: typeof t.revokedAt === "string" ? t.revokedAt : null,
      })) as ApiToken[];
      setMyTokens(norm);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Erro ao buscar tokens"));
    } finally {
      setLoadingMine(false);
    }
  }, []);

  const loadAll = React.useCallback(async () => {
    setLoadingOthers(true);
    try {
      // 🛑 CORREÇÃO: Adicionando a barra final para tentar resolver o 307
      const res = await fetch("/api/tokensall/", {
        method: "GET",
        cache: "no-store",
        credentials: "include", // Necessário para cookies
      });
      const body = await readJson<ListResp>(res);

      if (!res.ok || body?.success === false) {
        throw new Error(extractApiMessage(body) ?? "Falha ao carregar tokens");
      } // aceita { data } OU { items }

      const list: ApiToken[] = Array.isArray(body?.data)
        ? body!.data!
        : Array.isArray(body?.items)
        ? body!.items!
        : []; // normaliza campos de data para string|null

      const norm = list.map((t) => ({
        ...t,
        createdAt: typeof t.createdAt === "string" ? t.createdAt : null,
        expiresAt: typeof t.expiresAt === "string" ? t.expiresAt : null,
        revokedAt: typeof t.revokedAt === "string" ? t.revokedAt : null,
      })) as ApiToken[];
      setOthersTokens(norm);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Erro ao buscar tokens"));
    } finally {
      setLoadingOthers(false);
    }
  }, []);

  React.useEffect(() => {
    load();
    if (isAdmin) {
      loadAll();
    }
  }, [load, loadAll, isAdmin]); // Função unificada para aplicar a busca e ordenação

  const applyFilterAndSort = (tokens: ApiToken[], query: string) => {
    // Lógica de busca (do seu antigo 'filtered')
    const q = query.trim().toLowerCase();
    const filtered = q
      ? tokens.filter(
          (t) =>
            (t.description ?? "").toLowerCase().includes(q) ||
            (t.ownerEmail ?? "").toLowerCase().includes(q) ||
            (t.ownerName ?? "").toLowerCase().includes(q) ||
            (t.createdByName ?? "").toLowerCase().includes(q) ||
            (t.createdByEmail ?? "").toLowerCase().includes(q) ||
            (t.scope ?? "").toLowerCase().includes(q)
        )
      : tokens; // Lógica de ordenação (do seu 'filteredSorted')

    return [...filtered].sort((a, b) => {
      const aa = isAtivo(a) ? 1 : 0;
      const bb = isAtivo(b) ? 1 : 0;
      if (aa !== bb) return bb - aa;
      const ca = toMs(a.createdAt);
      const cb = toMs(b.createdAt);
      if (ca !== cb) return cb - ca;
      const ea = toMs(a.expiresAt);
      const eb = toMs(b.expiresAt);
      return ea - eb;
    });
  }; 

  const finalMyTokens = React.useMemo(() => {
    return applyFilterAndSort(myTokens, query);
  }, [myTokens, query]);  
 
  const finalOthersTokens = React.useMemo(() => {
    return applyFilterAndSort(othersTokens, query);
  }, [othersTokens, query]);

  const refreshAll = React.useCallback(async () => {
    await load();
    if (isAdmin) {
      await loadAll();
    }
  }, [load, loadAll, isAdmin]);

  async function revokeToken(tokenId: string) {
    try {
      const res = await fetch("/api/tokens", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId }),
      });
      const body = await readJson<ApiErrorShape & { success?: boolean }>(res);
      if (!res.ok || body?.success === false) {
        throw new Error(extractApiMessage(body) ?? "Falha ao revogar token");
      }
      toast.success("Token revogado");
      await refreshAll();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Erro ao revogar"));
    }
  }

  async function createToken(e: React.FormEvent) {
    e.preventDefault();
    try {
      setCreating(true); // Validação: não permitir passado (se informado)

      if (expiresDate) {
        const picked = new Date(`${expiresDate}T00:00:00`);
        const now = new Date();
        const today = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        if (picked < today) {
          toast.error("A data de expiração não pode ser no passado.");
          setCreating(false);
          return;
        }
      }

      const finalScope = isAdmin ? scope : "READ";
      const payload = {
        scope: finalScope,
        expiresAt: toIsoZ(expiresDate),
        description: description || null,
      };

      const res = await fetch("/api/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await readJson<CreateResp>(res);
      if (!res.ok || !body) {
        throw new Error(
          extractApiMessage(body) ?? "Não foi possível criar o token"
        );
      }

      const apiKeyFromData = body.data?.apiKey ?? body.apiKey ?? "";
      const tokenObj = body.data?.token ?? body.token;

      setApiKey(String(apiKeyFromData || ""));
      setCreatedPayload(
        tokenObj && apiKeyFromData
          ? { token: tokenObj as ApiToken, apiKey: apiKeyFromData }
          : null
      );

      setOpenCreate(false);
      setOpenResult(true);

      setScope("READ");
      setExpiresDate("");
      setDescription("");

      await refreshAll(); 
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Erro ao criar token"));
    } finally {
      setCreating(false);
    }
  }

  function copyApiKey() {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    toast.success("Chave copiada");
  }

  function downloadJson() {
    if (!createdPayload) return;
    const content = JSON.stringify(createdPayload ?? {}, null, 2);
    const blob = new Blob([content], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const nameFromId = createdPayload?.token?.id
      ? `token-${createdPayload.token.id}.json`
      : "token.json";
    a.download = nameFromId;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-semibold">Tokens de Acesso</h2>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              className="pl-8 w-64"
              placeholder="Buscar por descrição, dono ou escopo…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={load}
            disabled={loading}
            className="cursor-pointer"
          >
            <IconReload
              className={loading ? "size-4 animate-spin" : "size-4"}
            />
          </Button>

          {/* Dialog: criar token */}
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button className="cursor-pointer">
                <IconPlus className="mr-2 size-4" />
                Novo token
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Criar novo token</DialogTitle>
              </DialogHeader>

              <form onSubmit={createToken} className="grid gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="scope">Escopo</Label>

                  {isAdmin ? (
                    <Select value={scope} onValueChange={setScope}>
                      <SelectTrigger id="scope">
                        <SelectValue placeholder="Selecione o escopo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="READ">READ</SelectItem>
                        <SelectItem value="WRITE">WRITE</SelectItem>
                        <SelectItem value="READ_WRITE">READ_WRITE</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Select value="READ" onValueChange={() => {}} disabled>
                      <SelectTrigger id="scope">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="READ">READ</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="expires">Expira em <span className="!text-red-400">*</span></Label>
                  <Input
                    id="expires"
                    type="date"
                    value={expiresDate}
                    min={todayStr} // impede selecionar passado
                    onChange={(e) => setExpiresDate(e.target.value)}
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="desc">Descrição</Label>
                  <Input
                    id="desc"
                    placeholder="Ex.: Chave de leitura para integração X"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpenCreate(false)}
                    className="cursor-pointer"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={creating}
                    className="cursor-pointer"
                  >
                    {creating ? "Criando..." : "Criar token"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Dialog: resultado com a apiKey e JSON */}
          <Dialog open={openResult} onOpenChange={setOpenResult}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Token gerado</DialogTitle>
              </DialogHeader>

              <div className="grid gap-3">
                <p className="text-sm text-muted-foreground">
                  Guarde esta chave com segurança. Ela pode ser exibida apenas
                  agora.
                </p>

                <div className="rounded-md border bg-muted/30 p-3">
                  <code className="block w-full break-all text-sm">
                    {apiKey || "—"}
                  </code>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={copyApiKey}
                    className="cursor-pointer"
                  >
                    <IconClipboard className="mr-2 size-4" />
                    Copiar token
                  </Button>
                  <Button
                    variant="outline"
                    onClick={downloadJson}
                    className="cursor-pointer"
                  >
                    <IconDownload className="mr-2 size-4" />
                    Baixar JSON
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => setOpenResult(false)}
                  className="cursor-pointer"
                >
                  Fechar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="tokensCreateForMe" className="w-full">
        <TabsList>
          <TabsTrigger value="tokensCreateForMe">Gerados por mim</TabsTrigger>
          <TabsTrigger value="tokensCreateforOthers">
            Gerado por outros
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tokensCreateForMe">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Lista</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-md border">
                <TokenList
                  tokens={finalMyTokens}
                  loading={loadingMine}
                  revokeToken={revokeToken}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

                {isAdmin ? (
          <TabsContent value="tokensCreateforOthers">
            {othersTokens.length === 0 && !loadingOthers ? (
              <Card>
                <CardContent>
                  <div className="p-6 text-center text-yellow-600 bg-yellow-50 rounded-md border border-yellow-200">
                    <p className="font-medium">
                      Nenhum token encontrado.
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Nenhum token foi criado por outros usuários até o momento.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Tokens criados por outros usuários
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-hidden rounded-md border">
                    <TokenList
                      tokens={finalOthersTokens}
                      loading={loadingOthers}
                      revokeToken={revokeToken}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ) : (
          <TabsContent value="tokensCreateforOthers">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-center">
                  Acesso Negado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 text-center text-red-500 bg-red-100 rounded-md">
                  <h2>
                    Apenas administradores podem visualizar tokens gerados por outros.
                  </h2>
                  <p className="mt-2 text-sm text-red-700">
                    Essa aba está desativada para sua função usuários comuns.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
