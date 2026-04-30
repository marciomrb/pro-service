"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Heart,
  Settings,
  Search,
  Sparkles,
  PlusCircle,
  Tags,
  Briefcase,
  Users,
  LogOut,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { logout } from "@/actions/auth-actions";
import { Separator } from "../ui/separator";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  userType: string;
  dashboardLink: string;
}

export function AppSidebar({
  userType,
  dashboardLink,
  ...props
}: AppSidebarProps) {
  const pathname = usePathname();
  const { state } = useSidebar();

  const isActive = (path: string) => {
    if (path === dashboardLink) return pathname === path;
    // Evita que "Minhas Solicitações" fique ativo quando estiver em "Nova Solicitação"
    if (
      path === "/dashboard/client/requests" &&
      pathname === "/dashboard/client/requests/new"
    ) {
      return false;
    }
    return pathname === path || pathname.startsWith(path + "/");
  };

  const navItems = [
    {
      title: "Início",
      href: dashboardLink,
      icon: LayoutDashboard,
    },
    // Client items
    ...(userType === "client"
      ? [
          {
            title: "Minhas Solicitações",
            href: "/dashboard/client/requests",
            icon: Briefcase,
          },
          {
            title: "Nova Solicitação",
            href: "/dashboard/client/requests/new",
            icon: PlusCircle,
          },
          {
            title: "Favoritos",
            href: "/dashboard/client/favorites",
            icon: Heart,
          },
        ]
      : []),
    // Admin items
    ...(userType === "admin"
      ? [
          {
            title: "Categorias",
            href: "/dashboard/admin/categories",
            icon: Tags,
          },
          {
            title: "Gerenciar Serviços",
            href: "/dashboard/admin/services",
            icon: Briefcase,
          },
          {
            title: "Usuários",
            href: "/dashboard/admin/users",
            icon: Users,
          },
        ]
      : []),
    // Provider items
    ...(userType === "provider"
      ? [
          {
            title: "Solicitações",
            href: "/dashboard/provider/requests",
            icon: Briefcase,
          },
        ]
      : []),
    // Common items
    ...(userType !== "admin"
      ? [
          {
            title: "Mensagens",
            href:
              userType === "provider"
                ? "/dashboard/provider/messages"
                : "/dashboard/client/messages",
            icon: MessageSquare,
          },
        ]
      : []),
    {
      title: "Feed de Serviços",
      href: "/feed",
      icon: Sparkles,
    },
    {
      title: "Explorar",
      href: "/explore",
      icon: Search,
    },
  ];

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border bg-sidebar"
      {...props}
    >
      <SidebarHeader
        className={cn("pt-6 px-4 transition-all duration-300", {
          "px-2": isCollapsed,
        })}
      >
        <div
          className={cn("flex flex-col gap-6", {
            "items-center": isCollapsed,
          })}
        >
          <Link href="/" className="flex items-center justify-center">
            {isCollapsed ? (
              <img
                src="/logo.webp"
                alt="ProService"
                className="w-10 h-10 object-contain animate-in fade-in zoom-in duration-500"
              />
            ) : (
              <img
                src="/logo_full.webp"
                alt="ProService"
                className="h-9 w-auto block max-w-[180px] animate-in fade-in slide-in-from-left-4 duration-500"
              />
            )}
          </Link>

          {!isCollapsed && <Separator className="bg-sidebar-border/50" />}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 pt-6">
        {!isCollapsed && (
          <div className="px-4 mb-4">
            <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em]">
              Menu Principal
            </p>
          </div>
        )}
        <SidebarMenu className="gap-1.5">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={active}
                  tooltip={item.title}
                  size="lg"
                  className={cn(
                    "flex items-center gap-3 px-4 py-6 rounded-lg transition-all duration-300 group relative border-l-2 border-transparent overflow-hidden",
                    {
                      "bg-primary/10 text-primary font-semibold border-l-primary shadow-sm shadow-primary/5":
                        active,
                      "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground":
                        !active,
                    },
                  )}
                  render={
                    <Link
                      href={item.href}
                      className="flex items-center w-full"
                    />
                  }
                >
                  <item.icon
                    className={cn(
                      "w-[22px] h-[22px] shrink-0 transition-all duration-300 group-hover:scale-110",
                      {
                        "text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.2)]":
                          active,
                        "text-muted-foreground/70 group-hover:text-sidebar-foreground":
                          !active,
                      },
                    )}
                  />
                  {!isCollapsed && (
                    <span className="text-[15px] tracking-tight">
                      {item.title}
                    </span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border bg-sidebar-accent/10">
        <SidebarMenu className="gap-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={isActive("/dashboard/settings")}
              tooltip="Configurações"
              size="lg"
              className={cn(
                "flex items-center gap-3 px-4 py-6 rounded-xl transition-all duration-300 border-l-2 border-transparent",
                {
                  "bg-primary/10 text-primary font-semibold border-l-primary":
                    isActive("/dashboard/settings"),
                  "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground":
                    !isActive("/dashboard/settings"),
                },
              )}
              render={
                <Link
                  href="/dashboard/settings"
                  className="flex items-center w-full"
                />
              }
            >
              <Settings className="w-[22px] h-[22px] shrink-0" />
              {!isCollapsed && (
                <span className="text-[15px] tracking-tight">
                  Configurações
                </span>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <form action={logout} className="w-full">
              <SidebarMenuButton
                type="submit"
                tooltip="Sair da conta"
                size="lg"
                className="w-full flex items-center gap-3 px-4 py-6 rounded-xl text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive transition-all duration-300 font-medium group"
              >
                <LogOut className="w-[22px] h-[22px] shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
                {!isCollapsed && (
                  <span className="text-[15px] tracking-tight">
                    Sair da conta
                  </span>
                )}
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
