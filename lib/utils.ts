import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function fmtDate(d: unknown): string { // Adicione o tipo de retorno
  if (d == null) return "—";

  let dt: Date;

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