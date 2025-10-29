import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function fmtDate(d?: unknown) {
  if (!d) return "—";
  const dt = new Date(d as any);
  if (Number.isNaN(dt.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(dt);
}
