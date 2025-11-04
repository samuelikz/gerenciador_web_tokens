import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { Buffer } from "buffer"; // Necessário para a função parseJwt

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3333";
const AUTH_COOKIE = process.env.AUTH_COOKIE_NAME || "accessToken";

type Claims = {
  name?: string;
  email?: string;
  role?: "ADMIN" | "USER";
  id?: string;
  sub?: string;
};

function parseJwt<T>(token: string): T | null {
  try {
    const [, payload] = token.split(".");
    const json = Buffer.from(payload, "base64").toString("utf8");
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

async function getAuthToken() {
  return (await cookies()).get(AUTH_COOKIE)?.value;
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: userIdToEdit } = await context.params;
  const token = await getAuthToken();

  if (!token) {
    return NextResponse.json(
      { success: false, error: { message: "Não autenticado" } },
      { status: 401 }
    );
  }
  const loggedInClaims = parseJwt<Claims>(token);
  const loggedInUserId = loggedInClaims?.id || loggedInClaims?.sub;

  const body = (await req.json().catch(() => null)) as { role?: string };
  if (!body || !body.role) {
    return NextResponse.json(
      { success: false, error: { message: "Campo 'role' é obrigatório" } },
      { status: 400 }
    );
  } // Lógica de segurança (self-edit block)

  if (loggedInUserId && loggedInUserId === userIdToEdit) {
    if (body.role !== loggedInClaims?.role) {
      console.log(
        `[BLOQUEIO] Tentativa de auto-alteração de ${loggedInUserId} bloqueada.`
      );
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Você não pode alterar seu próprio papel de segurança.",
          },
        },
        { status: 403 }
      );
    }
  }

  const targetUrl = `${API}/users/${userIdToEdit}`;

  try {
    const resp = await fetch(targetUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }); // CORREÇÃO DO 'ANY'

    let jsonResponse: unknown = {};
    try {
      jsonResponse = await resp.json();
    } catch {}

    const responseData = jsonResponse as Record<string, unknown>;

    return NextResponse.json(
      {
        success: resp.ok,
        data: responseData?.data ?? responseData,
      },
      { status: resp.status }
    );
  } catch (error) {
    console.error("Erro ao chamar API:", error);
    return NextResponse.json(
      { success: false, error: { message: "Erro de rede ou proxy." } },
      { status: 500 }
    );
  }
}
