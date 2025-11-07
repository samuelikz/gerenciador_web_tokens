import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3333";
const AUTH_COOKIE = process.env.AUTH_COOKIE_NAME || "accessToken";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const token = (await cookies()).get(AUTH_COOKIE)?.value; // cookies() é síncrono
  if (!token) {
    return NextResponse.json(
      { success: false, error: { message: "Não autenticado" } },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);
  const targetUrl = `${API}/users/${id}/toggle`;

  try {
    const resp = await fetch(targetUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      redirect: "manual",
      body: JSON.stringify(body),
    });

    // evita seguir 30x e facilita debugar rota incorreta
    if (resp.status === 307 || resp.status === 302) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `Redirecionamento detectado (${resp.status}). Verifique a rota da API.`,
          },
        },
        { status: 400 }
      );
    }

    // Parse robusto do corpo
    const raw = await resp.text().catch(() => "");
    let parsed: unknown = null;
    try {
      parsed = raw ? JSON.parse(raw) : null;
    } catch {
      parsed = { raw };
    }

    const dataObj = parsed as Record<string, unknown> | null;

    return NextResponse.json(
      {
        success: resp.ok,
        data: dataObj?.data ?? dataObj?.user ?? dataObj,
      },
      { status: resp.status }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro de rede ou proxy.";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 }
    );
  }
}
