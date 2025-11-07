import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import UsersClientPage from "./client-page";
import { UserProvider } from "@/contexts/user-context"; // Importando o Provider

type Claims = { role?: "ADMIN" | "USER" };

function parseJwt<T>(token: string): T | null {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(Buffer.from(payload, "base64").toString("utf8")) as T;
  } catch {
    return null;
  }
}

export default async function Page() {
  const jar = await cookies();
  const token = jar.get(process.env.AUTH_COOKIE_NAME || "accessToken")?.value;
  const claims = token ? parseJwt<Claims>(token) : null;
  
  if (claims?.role !== "ADMIN") notFound();

  return (
    <UserProvider>
      <UsersClientPage />
    </UserProvider>
  );
}
