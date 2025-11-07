import { useAuth } from "@/contexts/auth-context";

export function useFetch() {
  const { token } = useAuth();

  async function request<T = any>(url: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) throw new Error(`Erro: ${res.status}`);
    return res.json();
  }

  return { request };
}
