import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { User, Shield, Bell, MapPin, CreditCard } from "lucide-react";
import SettingsForm from "@/components/dashboard/settings-form";
import AccountSettings from "@/components/dashboard/account-settings";
import NotificationSettings from "@/components/dashboard/notification-settings";
import LocationSettings from "@/components/dashboard/location-settings";
import BillingSettings from "@/components/dashboard/billing-settings";
import Link from "next/link";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "profile" } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let { data: profile } = await supabase
    .from("profiles")
    .select(
      `
      *,
      provider_profiles(*),
      client_profiles(*)
    `,
    )
    .eq("id", user.id)
    .single();

  if (!profile && user) {
    const { data: newProfile } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        full_name:
          user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
        role: user.user_metadata?.role || "client",
      })
      .select("*, provider_profiles(*), client_profiles(*)")
      .single();
    if (newProfile) profile = newProfile;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Configurações
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie sua conta e preferências de perfil.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-3 space-y-2">
          {[
            { id: "profile", icon: User, label: "Perfil" },
            { id: "account", icon: Shield, label: "Conta" },
            { id: "notifications", icon: Bell, label: "Notificações" },
            { id: "location", icon: MapPin, label: "Localização" },
            { id: "billing", icon: CreditCard, label: "Faturamento" },
          ].map((item) => (
            <Link
              key={item.id}
              href={`/dashboard/settings?tab=${item.id}`}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                tab === item.id
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </aside>

        {/* Content Area */}
        <div className="lg:col-span-9 space-y-8">
          {tab === "profile" && <SettingsForm user={user} profile={profile} />}
          {tab === "account" && <AccountSettings user={user} />}
          {tab === "notifications" && <NotificationSettings />}
          {tab === "location" && <LocationSettings profile={profile} />}
          {tab === "billing" && <BillingSettings profile={profile} />}
        </div>
      </div>
    </div>
  );
}
