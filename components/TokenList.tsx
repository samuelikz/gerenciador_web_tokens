import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { IconDotsVertical } from "@tabler/icons-react";
// Assumindo que fmtDate vem deste caminho
import { fmtDate } from "@/lib/utils";

// A função de formato de data local foi removida para usar a versão importada.

type ApiToken = {
  id: string;
  userId: string;
  createdByUserId: string;
  scope: Scope;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string | null;
  revokedAt: string | null;
  description: string | null;
  createdByName: string | null;
  createdByEmail: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
};

type TokenListProps = {
  tokens: ApiToken[]; // A lista de tokens
  loading: boolean;
  revokeToken: (tokenId: string) => Promise<void>; // Função de ação para revogação
};

// Lógica para determinar se o token está ativo
const isAtivo = (t: ApiToken) => !!(t.isActive && !t.revokedAt);

export default function TokenList({
  tokens,
  loading,
  revokeToken,
}: TokenListProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold text-gray-800">Tokens de Acesso</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="min-w-[150px]">Descrição</TableHead>
                <TableHead className="hidden sm:table-cell min-w-[150px]">Dono</TableHead>
                <TableHead className="hidden lg:table-cell min-w-[200px]">
                  E-mail do Dono
                </TableHead>
                <TableHead className="hidden md:table-cell min-w-[120px]">
                  Criado em
                </TableHead>
                <TableHead className="hidden lg:table-cell min-w-[120px]">
                  Expira em
                </TableHead>
                <TableHead className="hidden sm:table-cell">Escopo</TableHead>
                <TableHead className="text-center min-w-[80px]">Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-24 text-center text-blue-500 font-semibold"
                  >
                    Carregando tokens...
                  </TableCell>
                </TableRow>
              ) : tokens.length > 0 ? (
                tokens.map((t) => {
                  const ativo = isAtivo(t);
                  const statusVariant = ativo ? "default" : "secondary";
                  const expirationText = fmtDate(t.expiresAt);
                  const isExpired = t.expiresAt && new Date(t.expiresAt) < new Date() && ativo;

                  return (
                    <TableRow key={t.id} className={!ativo ? "opacity-60 bg-red-50/50" : ""}>
                      <TableCell className="font-medium text-gray-700">
                        {t.description || "Sem Descrição"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {t.ownerName || t.ownerEmail || "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-gray-500">
                        {t.ownerEmail || "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {fmtDate(t.createdAt)}
                      </TableCell>
                      <TableCell className={`hidden lg:table-cell text-sm ${isExpired ? 'text-red-500 font-semibold' : ''}`}>
                        {isExpired ? `EXPIRADO (${expirationText})` : expirationText}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className="px-2 border-indigo-300 text-indigo-600">
                          {t.scope || "geral"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={statusVariant} className={`px-2 ${ativo ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-gray-200 text-gray-600 hover:bg-gray-200'}`}>
                          {ativo ? "Ativo" : "Revogado"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              aria-label="Abrir ações do token"
                            >
                              <IconDotsVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {ativo ? (
                              <DropdownMenuItem
                                onClick={() => revokeToken(t.id)}
                                className="text-red-600 font-medium cursor-pointer focus:bg-red-50"
                              >
                                Revogar Token
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem disabled>
                                Ação Indisponível
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
                    Nenhum token encontrado.
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

