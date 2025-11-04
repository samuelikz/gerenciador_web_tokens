import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/ui/login-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Meu Dashboard', 
  // O resultado final na guia será: "Meu Dashboard | NomeDoSeuApp"
  // (graças ao 'template' que definimos no layout.tsx)
}

export default async function LoginPage() {
  // Se já estiver logado, nunca mostra o login:
  const cookieStore = await cookies();
  const token = cookieStore.get(process.env.AUTH_COOKIE_NAME || "accessToken")?.value;
  if (token) redirect("/dashboard");

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <LoginForm />
      </div>
    </div>
  );
}
