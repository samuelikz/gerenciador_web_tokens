// app/dashboard/layout.tsx
import { cookies } from "next/headers"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset } from "@/components/ui/sidebar"
import { ClientShell } from "./client-shell"
import { RoleProvider } from "@/contexts/role-context"

type Claims = { name?: string; email?: string; role?: "ADMIN" | "USER" }

function parseJwt<T>(token: string): T | null {
  try {
    const [, payload] = token.split(".")
    const json = Buffer.from(payload, "base64").toString("utf8")
    return JSON.parse(json) as T
  } catch {
    return null
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get(process.env.AUTH_COOKIE_NAME || "accessToken")?.value
  const claims = token ? parseJwt<Claims>(token) : null
  const role: "ADMIN" | "USER" | "" = claims?.role ?? ""

  return (
    <ClientShell>
      <RoleProvider role={role}>
        <AppSidebar
          variant="inset"
          isAdmin={role === "ADMIN"}
          user={{ name: claims?.name, email: claims?.email, avatar: null }}
        />
        <SidebarInset>
          <SiteHeader user={{ name: claims?.name, email: claims?.email, role }} />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">{children}</div>
            </div>
          </div>
        </SidebarInset>
      </RoleProvider>
    </ClientShell>
  )
}
