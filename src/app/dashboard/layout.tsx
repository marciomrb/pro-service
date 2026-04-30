import Link from "next/link";
import {
  Search,
} from "lucide-react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import NotificationCenter from "@/components/notifications/notification-center";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";
  
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let { data: profile } = await supabase
    .from("profiles")
    .select("*, provider_profiles(*)")
    .eq("id", user?.id)
    .single();

  if (!profile && user) {
    // Attempt to create a fallback profile
    const { data: newProfile } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        full_name:
          user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
        role: user.user_metadata?.role || "client",
      })
      .select("full_name, avatar_url, role")
      .single();

    if (newProfile) {
      profile = newProfile;
    }
  }

  const userType = profile?.role || "client";
  const dashboardLink =
    userType === "provider"
      ? "/dashboard/provider"
      : userType === "admin"
        ? "/dashboard/admin"
        : "/dashboard/client";

  const avatarUrl =
    profile?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || user?.email || "User")}&background=0E5D91&color=fff`;

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar userType={userType} dashboardLink={dashboardLink} />
      <SidebarInset className="bg-background">
        <div className="flex flex-col min-h-screen">
          <DashboardHeader 
            userType={userType} 
            profile={profile} 
            avatarUrl={avatarUrl} 
          />

          <main className="flex-1 p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {children}
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
