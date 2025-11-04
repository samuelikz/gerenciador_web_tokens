// app/api/_lib/apiFetch.ts
import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3333";
const AUTH_COOKIE = process.env.AUTH_COOKIE_NAME || "accessToken";

export async function apiFetch(path: string, init: RequestInit = {}) {
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE)?.value;
  if (!token) {
    return new Response(JSON.stringify({ success:false, error:{ message:"Não autenticado" } }), { status: 401 });
  }

  const headers = new Headers(init.headers);
  if (!headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers, cache: "no-store" });

  let data: unknown = null;
  try { data = await res.json(); } catch { data = { raw: await res.text().catch(() => "") }; }

  return new Response(JSON.stringify(data), { status: res.status });
}
