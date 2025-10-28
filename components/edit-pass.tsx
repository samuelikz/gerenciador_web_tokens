"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type UpdateResp = { success?: boolean; message?: string } & Record<string, unknown>;

function getErrorMessage(err: unknown, fallback = "Ocorreu um erro"): string {
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;
    return fallback;
}
async function readJson<T>(res: Response): Promise<T | null> {
    try { return (await res.json()) as T } catch { return null }
}
function extractApiMessage(body: unknown): string | null {
    const maybe = body as Record<string, unknown>;
    const nested = maybe.error as { message?: string } | undefined;
    if (nested?.message) return nested.message;
    const msg = maybe.message;
    if (typeof msg === "string") return msg;
    return null;
}


export default function ChangePasswordForm({ userId, onSuccess }: {
    userId: string | number | undefined;
    onSuccess: () => void;
}) {
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [saving, setSaving] = React.useState(false);

    async function handleChangePassword(e: React.FormEvent) {
        e.preventDefault();

        if (!userId) return toast.error("ID do usuário não encontrado.");
        if (newPassword.length < 6) return toast.error("A nova senha deve ter pelo menos 6 caracteres.");
        
        if (newPassword !== confirmPassword) {
            return toast.error("As senhas não coincidem.");
        }
        
        try {
            setSaving(true);

            const payload = {
                newPassword,
            };
            
            const res = await fetch(`/api/users/me/password`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                redirect: 'manual',
            });

            const body = await readJson<UpdateResp>(res);

            if (!res.ok || body?.success === false) {
                throw new Error(extractApiMessage(body) ?? "Falha ao alterar a senha.");
            }

            toast.success("Senha alterada com sucesso!");
            onSuccess();
            
        } catch (err) {
            toast.error(getErrorMessage(err, "Erro ao alterar a senha."));
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleChangePassword} className="grid gap-4">
            
            <div className="grid gap-1.5">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input 
                    id="newPassword" 
                    type="password"
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    disabled={saving}
                    placeholder="Mínimo 6 caracteres"
                />
            </div>
            
            <div className="grid gap-1.5">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input 
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    disabled={saving}
                />
            </div>
            
            <div className="mt-4 flex justify-end">
                <Button type="submit" disabled={saving}>
                    {saving ? "Salvando..." : "Alterar Senha"}
                </Button>
            </div>
        </form>
    );
}
