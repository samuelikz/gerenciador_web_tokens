"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconMail, IconBriefcase, IconCalendar, IconEdit } from "@tabler/icons-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/auth-context";
import EditProfileForm from "@/components/edit-profile";
import { fmtDate } from "@/lib/utils";

export default function PerfilPage() {
  const { user, reloadUser, logout, loading } = useAuth();
  const [openEdit, setOpenEdit] = React.useState(false);

  const initials = React.useMemo(() => {
    const base = user?.name || user?.email || "U";
    return base
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("");
  }, [user]);

  if (!user && !loading) {
    return (
      <div className="flex flex-col gap-6 px-4 lg:px-6">
        <h1 className="text-3xl font-semibold text-red-500">Erro de Acesso</h1>
        <p className="text-muted-foreground">
          Não foi possível carregar os dados do seu perfil. Tente recarregar a página.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <h1 className="text-3xl font-semibold">Minha Conta</h1>

      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user?.avatar || "/avatars/shadcn.jpg"} alt={user?.name || "Usuário"} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">{user?.name || "Usuário"}</CardTitle>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <Dialog open={openEdit} onOpenChange={setOpenEdit}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <IconEdit className="size-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Editar Perfil</DialogTitle>
                </DialogHeader>
                <EditProfileForm
                  initialData={user}
                  onSuccess={() => {
                    setOpenEdit(false);
                    reloadUser();
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4">
          <div className="flex items-center gap-3">
            <IconMail className="size-5 text-primary" />
            <span className="font-medium">E-mail:</span>
            <span>{user?.email || "Não informado"}</span>
          </div>

          <div className="flex items-center gap-3">
            <IconBriefcase className="size-5 text-primary" />
            <span className="font-medium">Papel (Role):</span>
            <span>{user?.role || "USER"}</span>
          </div>

          <div className="flex items-center gap-3">
            <IconCalendar className="size-5 text-primary" />
            <span className="font-medium">Membro desde:</span>
            <span>{fmtDate(user?.createdAt)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
