import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { Buffer } from "buffer"; 

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3333";
const AUTH_COOKIE = process.env.AUTH_COOKIE_NAME || "accessToken";

type Claims = { name?: string; email?: string; role?: "ADMIN" | "USER"; id?: string; sub?: string; };

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

export async function PATCH(req: NextRequest) {
    
    const token = await getAuthToken(); 

    if (!token) {
        return NextResponse.json(
            { success: false, error: { message: "Não autenticado" } },
            { status: 401 }
        );
    }
    
    const body: { userId?: string; [key: string]: unknown } | null = await req.json().catch(() => null);

    const loggedInClaims = parseJwt<Claims>(token);
    const loggedInUserId = loggedInClaims?.id || loggedInClaims?.sub; 
    
    const userIdToToggle = body?.userId;

    if (loggedInUserId && loggedInUserId === userIdToToggle) {
         console.log(`[BLOQUEIO] Tentativa de auto-toggle de ${loggedInUserId} bloqueada.`);
         return NextResponse.json(
            { success: false, error: { message: "Você não pode desativar sua própria conta." } },
            { status: 403 } // 403 Forbidden
        );
    }

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
            body: JSON.stringify(body), 
        });

        console.log(`[Toggle] Resposta da API externa: ${resp.status}`);

        let jsonResponse: unknown = {}; 
        try {
            jsonResponse = await resp.json();
        } catch {
             console.log("[Toggle] Resposta sem corpo JSON.");
        }
        
        return NextResponse.json(
            {
                success: resp.ok,
                data: jsonResponse, 
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

