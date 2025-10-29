"use client";

import * as React from "react";
import { toast } from "sonner";
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
import { useTokens } from "@/contexts/tokens-context";
import { useRole } from "@/contexts/role-context";

export default function TokensPage() {
  const role = useRole();
  const isAdmin = role === "ADMIN";
  const {
    myTokens,
    othersTokens,
    loadingMine,
    loadingOthers,
    refreshAll,
    revokeToken,
    createToken,
  } = useTokens();

  const [query, setQuery] = React.useState("");
  const [openCreate, setOpenCreate] = React.useState(false);
  const [scope, setScope] = React.useState("READ");
  const [expiresDate, setExpiresDate] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  const [openResult, setOpenResult] = React.useState(false);
  const [apiKey, setApiKey] = React.useState("");
  const [createdPayload, setCreatedPayload] = React.useState<any>(null);

  const todayStr = new Date().toISOString().slice(0, 10);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!expiresDate) {
      toast.error("A data de expiração é obrigatória.");
      return;
    }
    setCreating(true);
    const payload = {
      scope: isAdmin ? scope : "READ",
      expiresAt: new Date(`${expiresDate}T23:59:59.999Z`).toISOString(),
      description: description || null,
    };
    const result = await createToken(payload);
    if (result) {
      setApiKey(result.apiKey);
      setCreatedPayload(result);
      setOpenCreate(false);
      setOpenResult(true);
    }
    setCreating(false);
  }

  function copyApiKey() {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    toast.success("Chave copiada");
  }

  function downloadJson() {
    if (!createdPayload) return;
    const content = JSON.stringify(createdPayload, null, 2);
    const blob = new Blob([content], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `token-${createdPayload.token?.id ?? "novo"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      {/* header e busca */}
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
          <Button variant="outline" size="icon" onClick={refreshAll}>
            <IconReload className="size-4" />
          </Button>

          {/* Dialog de criação */}
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button>
                <IconPlus className="mr-2 size-4" />
                Novo token
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar novo token</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="grid gap-4">
                <div>
                  <Label>Escopo</Label>
                  {isAdmin ? (
                    <Select value={scope} onValueChange={setScope}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o escopo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="READ">READ</SelectItem>
                        <SelectItem value="WRITE">WRITE</SelectItem>
                        <SelectItem value="READ_WRITE">READ_WRITE</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Select value="READ" disabled>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </Select>
                  )}
                </div>
                <div>
                  <Label>Expira em</Label>
                  <Input
                    type="date"
                    value={expiresDate}
                    min={todayStr}
                    onChange={(e) => setExpiresDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Input
                    placeholder="Ex.: Chave de leitura para integração X"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpenCreate(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? "Criando..." : "Criar token"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Dialog resultado */}
          <Dialog open={openResult} onOpenChange={setOpenResult}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Token gerado</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3">
                <p className="text-sm text-muted-foreground">
                  Guarde esta chave com segurança. Ela só é exibida agora.
                </p>
                <div className="rounded-md border bg-muted/30 p-3">
                  <code className="block w-full break-all text-sm">{apiKey || "—"}</code>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={copyApiKey}>
                    <IconClipboard className="mr-2 size-4" />
                    Copiar token
                  </Button>
                  <Button variant="outline" onClick={downloadJson}>
                    <IconDownload className="mr-2 size-4" />
                    Baixar JSON
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setOpenResult(false)}>Fechar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tokensCreateForMe" className="w-full">
        <TabsList>
          <TabsTrigger value="tokensCreateForMe">Gerados por mim</TabsTrigger>
          <TabsTrigger value="tokensCreateforOthers">Gerado por outros</TabsTrigger>
        </TabsList>

        <TabsContent value="tokensCreateForMe">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Lista</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-md border">
                <TokenList tokens={myTokens} loading={loadingMine} revokeToken={revokeToken} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tokensCreateforOthers">
          {isAdmin ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Tokens criados por outros usuários</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-md border">
                  <TokenList tokens={othersTokens} loading={loadingOthers} revokeToken={revokeToken} />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <div className="p-4 text-center text-red-500 bg-red-100 rounded-md">
                  <h2>Acesso Negado</h2>
                  <p className="text-sm mt-1">
                    Apenas administradores podem visualizar tokens gerados por outros usuários.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
