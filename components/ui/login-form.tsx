"use client";

import * as React from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { login, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const loggedUser = await login(email, password);

      // --- CORREÇÃO ---
      // 1. Verifique o status 'active' APENAS no objeto 'loggedUser' retornado pelo login.
      // 2. Verifique explicitamente se o status é 'false'.
      const active = loggedUser?.isActive;
      console.log("Usuário após login:", loggedUser);


      if (active === false) { // Se for explicitamente false, o usuário está inativo
        
        toast.error("Usuário inativo. Entre em contato com o suporte.");
        // Se a sua função login() loga o usuário ANTES de retornar, 
        // você pode querer chamar logout() aqui para garantir que ele não fique logado.
        return; // Para a execução e não redireciona
      }

      // Se isActive for 'true' ou 'undefined' (status não definido), o login continua.
      // Se a regra de negócio for que 'undefined' deve bloquear, 
      // você pode usar a sua lógica original: if (!isActive) { ... }
      // Mas lembre-se de remover o '?? user?.active'.

      toast.success("Login efetuado com sucesso!");
      router.replace("/dashboard");
    } catch (err: unknown) {
      let errorMessage = "Falha no login";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-9", className)} {...props}>
      <Card className="h-[350px] overflow-hidden p-0 shadow-lg md:rounded-lg md:border md:shadow-none">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={onSubmit} noValidate>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Acesso restrito</h1>
                <p className="text-balance text-muted-foreground">
                  Faça login com sua conta de acesso.
                </p>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@local.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Digitar senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="mt-3 w-full" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </div>
          </form>

          <div className="relative bg-muted">
            <Image
              src="/logo.png"
              alt="Logo"
              fill
              priority
              className="object-fill"
              sizes="(max-width: 768px) 0, (min-width: 769px) 50vw"
            />
          </div>
        </CardContent>
      </Card>

      <div className="text-balance text-center text-xs text-muted-foreground">
        <p className="text-center text-sm text-muted-foreground">
          Não conseguiu acessar sua conta?{" "}
          <a href="mailto:suportesiga@perpart.com.br" className="font-medium">
            Entre em contato com o suporte
          </a>{" "}
          e nossa equipe irá te ajudar.
        </p>
      </div>
    </div>
  );
}
