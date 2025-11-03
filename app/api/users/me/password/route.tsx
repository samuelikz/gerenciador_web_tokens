import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic"; export const revalidate = 0; export const runtime = "nodejs";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3333";
const AUTH_COOKIE = process.env.AUTH_COOKIE_NAME || "accessToken";

// 🛑 FUNÇÃO AUXILIAR PARA CORRIGIR O ERRO DE TIPAGEM DOS COOKIES
async function getAuthToken() {
    return (await cookies()).get(AUTH_COOKIE)?.value;
}

/**
 * PATCH /api/users/me/password
 * Altera a senha do USUÁRIO LOGADO (ID inferido pelo token).
 */
// 🛑 ASSINATURA CORRIGIDA: Não aceita 'context' nem 'params'
export async function PATCH(req: NextRequest) {
    
    const token = await getAuthToken(); // ⬅️ Usa a função auxiliar corrigida

    if (!token) {
        return NextResponse.json(
            { success: false, error: { message: "Não autenticado" } },
            { status: 401 }
        );
    }
    
    // 1. OBTER DADOS DO CORPO (BODY)
    const body = await req.json().catch(() => null);

    // 2. LÓGICA DE PROXY: Bate na rota 'me/password' da API externa
    const targetUrl = `${API}/users/me/password`; 

    console.log(`🔄 Enviando PATCH para (Meu Perfil): ${targetUrl}`);

    try {
        const resp = await fetch(targetUrl, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body), 
        });

        console.log(`[Password] Resposta da API externa: ${resp.status}`);

        let jsonResponse: unknown = {}; 
        try {
            jsonResponse = await resp.json();
        } catch {
             console.log("[Password] Resposta sem corpo JSON.");
        }
        
        const responseData = jsonResponse as Record<string, unknown>;

        return NextResponse.json(
            {
                success: resp.ok,
                data: responseData?.data ?? responseData,
            },
            { status: resp.status }
        );
    } catch (error) {
        console.error("❌ Erro ao chamar API (Password):", error);
        return NextResponse.json(
            { success: false, error: { message: "Erro de rede ou proxy." } },
            { status: 500 }
        );
    }
}
