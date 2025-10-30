import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3333";
const AUTH_COOKIE = process.env.AUTH_COOKIE_NAME || "accessToken";

export async function PATCH(req: NextRequest) {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, error: { message: "Não autenticado" } },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);

  console.log("🔄 Enviando PATCH para:", `${API}/users/toggle`);
  console.log("📦 Body:", body);

  try {
    const resp = await fetch(`${API}/users/toggle`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    let jsonResponse: any = {};
    try {
      jsonResponse = await resp.json();
    } catch {
      console.log("errou")
    }

    return NextResponse.json(
      {
        success: resp.ok,
        data: jsonResponse,
      },
      { status: resp.status }
    );
  } catch (error) {
    console.error("❌ Erro ao chamar API:", error);
    return NextResponse.json(
      { success: false, error: { message: "Erro de rede ou proxy." } },
      { status: 500 }
    );
  }
}
