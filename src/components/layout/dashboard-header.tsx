"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import NotificationCenter from "@/components/notifications/notification-center";

interface DashboardHeaderProps {
  userType: string;
  profile: any;
  avatarUrl: string;
}

export function DashboardHeader({
  userType,
  profile,
  avatarUrl,
}: DashboardHeaderProps) {
  const pathname = usePathname();
  
  const getPageTitle = (path: string) => {
    // Normalize path by removing trailing slash
    const normalizedPath = path.replace(/\/$/, "");

    const titles: Record<string, string> = {
      "/dashboard/client": "Início",
      "/dashboard/provider": "Início",
      "/dashboard/admin": "Painel Administrativo",
      "/dashboard/client/requests": "Minhas Solicitações",
      "/dashboard/client/requests/new": "Nova Solicitação",
      "/dashboard/client/favorites": "Favoritos",
      "/dashboard/client/messages": "Mensagens",
      "/dashboard/provider/requests": "Solicitações Recebidas",
      "/dashboard/provider/messages": "Mensagens",
      "/dashboard/admin/categories": "Gerenciar Categorias",
      "/dashboard/admin/services": "Gerenciar Serviços",
      "/dashboard/admin/users": "Gerenciar Usuários",
      "/dashboard/settings": "Configurações",
    };

    // Check for exact match in normalized path
    if (titles[normalizedPath]) return titles[normalizedPath];

    // Check for dynamic routes or subpages
    if (normalizedPath.includes("/requests/")) return "Detalhes da Solicitação";
    if (normalizedPath.includes("/messages/")) return "Chat";
    if (normalizedPath.includes("/provider/")) return "Perfil do Profissional";

    const segments = normalizedPath.split("/").filter(Boolean);
    const last = segments[segments.length - 1];
    return last ? last.charAt(0).toUpperCase() + last.slice(1) : "Dashboard";
  };

  const pageTitle = getPageTitle(pathname);

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-muted-foreground hover:text-primary transition-colors" />
        <div className="h-6 w-px bg-border hidden sm:block" />
        <nav className="hidden sm:flex items-center gap-2 text-sm font-medium">
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ProService
          </Link>
          <span className="text-muted-foreground/50">/</span>
          <span className="text-foreground font-semibold">{pageTitle}</span>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden lg:flex relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Pesquisar..."
            className="pl-10 pr-4 py-2 bg-muted/50 border border-transparent focus:border-primary/20 focus:bg-white rounded-xl text-sm transition-all w-64 outline-none focus:ring-4 focus:ring-primary/10"
          />
        </div>

        <div className="flex items-center gap-2">
          <NotificationCenter />

          <div className="h-8 w-px bg-border mx-2" />

          <div className="flex items-center gap-3 pl-2">
            <div className="flex-col items-end hidden sm:flex">
              <span className="text-sm font-semibold text-foreground leading-none">
                {profile?.full_name?.split(" ")[0]}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                {userType}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/10 overflow-hidden shadow-sm">
              <img
                src={avatarUrl}
                alt={profile?.full_name || "Profile"}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
