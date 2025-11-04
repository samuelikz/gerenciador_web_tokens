"use client";

import * as React from "react";
import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import type { Icon } from "@tabler/icons-react";
import {
  IconInnerShadowTop,
  IconLayoutDashboard,
  IconListDetails,
  IconUsers,
  IconHelpCircle,
  IconFileText,
} from "@tabler/icons-react";

import type { UserData } from "@/types/user";

// --- TIPOS DE DADOS ---
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  isAdmin?: boolean;
  user?: { name?: string; email?: string; avatar?: string | null };
}

type NavItem = { title: string; url: string; icon: Icon; adminOnly?: true };
type DocItem = { name: string; url: string; icon: Icon };

type MeResponse =
  | { success: true; data: UserData }
  | { success: false; message: string };

const base = {
  navMain: [
    { title: "Dashboard", url: "/dashboard", icon: IconLayoutDashboard },
    { title: "Tokens", url: "/dashboard/tokens", icon: IconListDetails },
    {
      title: "Usuários",
      url: "/dashboard/users",
      icon: IconUsers,
      adminOnly: true as const,
    },
  ] as NavItem[],
  navSecondary: [
    { title: "Ajuda", url: "#", icon: IconHelpCircle },
  ] as NavItem[],
  documents: [
    { name: "Playground", url: "/dashboard/documentos", icon: IconFileText },
  ] as DocItem[],
};

export function AppSidebar({
  isAdmin: isAdminProp,
  user: userProp,
  ...props
}: AppSidebarProps) {
  const [me, setMe] = React.useState<UserData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await fetch(`/api/users/me/profile`, { 
          credentials: "include",
          cache: "no-store",
        });
        
        const json = (await res.json().catch(() => ({}))) as MeResponse;
        
        if (!mounted) return;

        if (json && "success" in json && json.success) {
          const d = json.data;
          
          setMe({
            id: d.id,
            email: d.email,
            role: d.role,
            name: d.name ?? (d.email ? d.email.split("@")[0] : undefined),
            avatar: d.avatar ?? null,
          });
        } else {
          setMe(null); 
        }
      } catch (e) {
        if (!mounted) return;
        setMe(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []); 

  const isAdminDetected = me?.role === "ADMIN";
  const isAdmin =
    typeof isAdminProp === "boolean" ? isAdminProp : isAdminDetected;

  const resolvedUser = {
    name:
      userProp?.name ??
      me?.name ??
      (me?.email ? me.email.split("@")[0] : undefined) ??
      "Usuário Desconhecido", 
    email: userProp?.email ?? me?.email ?? "—",
    avatar: userProp?.avatar ?? me?.avatar ?? "/avatars/shadcn.jpg",
  };

  const navMain = base.navMain.filter((i) => !i.adminOnly || isAdmin);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">
                  Siga Api Perpart.
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {loading ? (
            <div className="p-3 text-sm text-muted-foreground">Carregando menu...</div>
        ) : (
            <>
                <NavMain items={navMain} /> 
                <NavDocuments items={base.documents} />
                <NavSecondary items={base.navSecondary} className="mt-auto" />
            </>
        )}
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={resolvedUser} />
      </SidebarFooter>
    </Sidebar>
  );
}
