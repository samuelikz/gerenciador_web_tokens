import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


// 🛑 CORREÇÃO (Exemplo para fmtDate):
export function fmtDate(d: unknown): string { // Adicione o tipo de retorno
  if (d == null) return "—";

  let dt: Date;

  // 🛑 AQUI ESTÁ A VERIFICAÇÃO (Type Guard):
  // Nós só chamamos new Date() se o tipo for um destes:
  if (typeof d === "string" || typeof d === "number" || d instanceof Date) {
    dt = new Date(d); // Agora é seguro!
  } else {
    return "—"; // Retorna se o tipo for inválido
  }

  if (Number.isNaN(dt.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(dt);
  } catch {
    return "—";
  }
}