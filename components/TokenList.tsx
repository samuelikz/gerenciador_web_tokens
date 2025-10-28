// Exemplo: components/token-list.tsx

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { IconDotsVertical } from "@tabler/icons-react"; // ou lucide-react se preferir

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

type TokenListProps = {
  tokens: ApiToken[]; // A lista já filtrada e ordenada (ex: finalMyTokens)
  loading: boolean;
  revokeToken: (tokenId: string) => Promise<void>; // Função de ação
};

const isAtivo = (t: ApiToken) => !!(t.isActive && !t.revokedAt);

function fmtDate(d?: unknown) {
  if (d == null) return "—";

  let dt: Date;
  if (typeof d === "string" || typeof d === "number") {
    dt = new Date(d);
  } else if (d instanceof Date) {
    dt = d;
  } else if (typeof (d as any)?.toString === "function") {
    dt = new Date((d as any).toString());
  } else {
    return "—";
  }

    if (Number.isNaN(dt.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(dt);
  } catch {
    return "—";
  }
}

  export default function TokenList({
  tokens,
  loading,
  revokeToken,
}: TokenListProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Lista</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead className="hidden md:table-cell">Dono</TableHead>
                <TableHead className="hidden xl:table-cell">
                  E-mail do dono
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  Criado em
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  Expira em
                </TableHead>
                <TableHead className="hidden sm:table-cell">Escopo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {tokens.length ? (
                tokens.map((t) => {
                  const ativo = isAtivo(t);
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">
                        {t.description || "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {t.ownerName || t.ownerEmail || "—"}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        {t.ownerEmail || "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {fmtDate(t.createdAt)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {fmtDate(t.expiresAt)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className="px-2">
                          {t.scope || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {ativo ? (
                          <Badge variant="outline" className="px-2">
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="px-2">
                            Revogado
                          </Badge>
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
                              <span className="sr-only">Ações</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {ativo ? (
                              <>
                                <DropdownMenuItem
                                  onClick={() => revokeToken(t.id)}
                                  className="text-destructive cursor-pointer"
                                >
                                  Revogar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            ) : (
                              <DropdownMenuItem disabled>
                                Revogado
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {loading ? "Carregando…" : "Nada encontrado."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}