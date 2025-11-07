import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { NextRequest } from "next/server"; // Importando NextRequest para tipar o request

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3333";
const AUTH_COOKIE = process.env.AUTH_COOKIE_NAME || "accessToken";

type UserData = { user?: unknown; data?: unknown } & Record<string, unknown>;

// --- Função Helper para obter o Token ---
async function getAuthToken() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  return token
}

// --- FUNÇÃO GET (Já existia) ---
// Busca o perfil do usuário
export async function GET() {
  const token = await getAuthToken();

  if (!token) {
    return NextResponse.json(
      { success: false, error: { message: "Não autenticado" } },
      { status: 401 }
    );
  }

  const resp = await fetch(`${API}/users/me/profile`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  });

  let body: unknown = {};
  try {
    body = await resp.json();
  } catch { }

  const bodyAsData = body as UserData;
  const user = bodyAsData?.data ?? bodyAsData?.user ?? body;

  return NextResponse.json(
    { success: resp.ok, data: user },
    { status: resp.status }
  );
}


// --- NOVA FUNÇÃO PATCH ---
// Atualiza o perfil do usuário
export async function PATCH(request: NextRequest) {
  const token = await getAuthToken();

  if (!token) {
    return NextResponse.json(
      { success: false, error: { message: "Não autenticado" } },
      { status: 401 }
    );
  }

  let payload: unknown;
  try {
    // Lê o corpo da requisição (name, email, etc.)
    payload = await request.json();
  } catch (e) {
    return NextResponse.json(
      { success: false, error: { message: "Payload inválido" } },
      { status: 400 }
    );
  }

  const resp = await fetch(`${API}/users/me/profile`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify(payload), // Envia o payload recebido
  });

  let body: unknown = {};
  try {
    body = await resp.json();
  } catch { }

  return NextResponse.json(
    { success: resp.ok, data: body },
    { status: resp.status }
  );
}

