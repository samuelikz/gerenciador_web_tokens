import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { Buffer } from "buffer"; // Necessário para a função parseJwt

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3333";
const AUTH_COOKIE = process.env.AUTH_COOKIE_NAME || "accessToken";

// --- Tipos e Funções Auxiliares ---
type Claims = { name?: string; email?: string; role?: "ADMIN" | "USER"; id?: string; sub?: string; };

// Função de parse JWT (Server-side)
function parseJwt<T>(token: string): T | null {
    try {
        const [, payload] = token.split(".");
        const json = Buffer.from(payload, "base64").toString("utf8");
        return JSON.parse(json) as T;
    } catch {
        return null;
    }
}

// 🛑 FUNÇÃO AUXILIAR PARA CORRIGIR O ERRO DE TIPAGEM DOS COOKIES
async function getAuthToken() {
    return (await cookies()).get(AUTH_COOKIE)?.value;
}


/**
 * PATCH /api/users/toggle
 * (Versão Mesclada com Bloco de Segurança)
 * Repassa a requisição para a API externa, mas bloqueia auto-edição.
 */
export async function PATCH(req: NextRequest) {
    
    const token = await getAuthToken(); // ⬅️ Usa a função auxiliar corrigida

    if (!token) {
        return NextResponse.json(
            { success: false, error: { message: "Não autenticado" } },
            { status: 401 }
        );
    }
    
    // 1. OBTER DADOS DO CORPO (BODY) - Lógica simples
    // Esperamos um corpo como: { userId: "...", isActive: ... }
    const body: { userId?: string; [key: string]: unknown } | null = await req.json().catch(() => null);

    // 2. OBTER ID DO USUÁRIO LOGADO (DO TOKEN)
    const loggedInClaims = parseJwt<Claims>(token);
    const loggedInUserId = loggedInClaims?.id || loggedInClaims?.sub; 
    
    const userIdToToggle = body?.userId;

    // 3. VERIFICAÇÃO DE SEGURANÇA: IMPEDIR AUTO-EDIÇÃO
    // Verifica se o ID do alvo (do corpo) é o mesmo do usuário logado (do token)
    if (loggedInUserId && loggedInUserId === userIdToToggle) {
         console.log(`[BLOQUEIO] Tentativa de auto-toggle de ${loggedInUserId} bloqueada.`);
         return NextResponse.json(
            { success: false, error: { message: "Você não pode desativar sua própria conta." } },
            { status: 403 } // 403 Forbidden
        );
    }

    // 4. LÓGICA DE PROXY (Versão funcional)
    // A rota externa é a rota de toggle não dinâmica
    const targetUrl = `${API}/users/toggle`;

    console.log(`🔄 Enviando PATCH para (Toggle): ${targetUrl}`);
    console.log("📦 Body (Toggle):", body);

    try {
        const resp = await fetch(targetUrl, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            // 5. Envia o corpo inteiro recebido do frontend
            body: JSON.stringify(body), 
        });

        console.log(`[Toggle] Resposta da API externa: ${resp.status}`);

        let jsonResponse: unknown = {}; // 🛑 CORREÇÃO: any -> unknown
        try {
            jsonResponse = await resp.json();
        } catch {
             console.log("[Toggle] Resposta sem corpo JSON.");
        }
        
        return NextResponse.json(
            {
                success: resp.ok,
                data: jsonResponse, // Retorna os dados brutos da API externa
            },
            { status: resp.status }
        );
    } catch (error) {
        console.error("❌ Erro ao chamar API (Toggle):", error);
        return NextResponse.json(
            { success: false, error: { message: "Erro de rede ou proxy." } },
            { status: 500 }
        );
    }
}

