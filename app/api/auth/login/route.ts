import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "accessToken"; // Reintroduzindo a constante para o cookie.

type BackendPayload = {
  data?: {
    access_token?: string;
    token?: string;
    accessToken?: string;
    user?: { active: boolean };
  };
  access_token?: string;
  token?: string;
  accessToken?: string;
  user?: { active: boolean };
  message?: string;
  error?: { message?: string };
};

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });
  const payload: BackendPayload = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      payload?.message ||
      payload?.error?.message ||
      `Falha no login (HTTP ${res.status})`;
    return NextResponse.json({ success: false, message }, { status: res.status });
  }

  const token: string | undefined =
    payload?.data?.access_token ??
    payload?.access_token ??
    payload?.data?.token ??
    payload?.token ??
    payload?.data?.accessToken ??
    payload?.accessToken;

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Token ausente na resposta da API" },
      { status: 500 }
    );
  }

  const response = NextResponse.json({ success: true, token: token });

  (await cookies()).set({
    name: COOKIE_NAME, // Usando a constante definida
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
  });

  return response;
}