import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Tags, Briefcase, Users, Activity } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Painel Administrativo</h1>
        <p className="text-muted-foreground mt-1">Visão geral do sistema e atalhos rápidos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 rounded-3xl border-border/50 shadow-sm flex flex-col gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Tags className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Categorias</h3>
            <p className="text-muted-foreground text-sm">Gerencie categorias e subcategorias</p>
          </div>
          <Link href="/dashboard/admin/categories" className="text-sm font-medium text-primary hover:underline mt-auto">
            Acessar →
          </Link>
        </Card>

        <Card className="p-6 rounded-3xl border-border/50 shadow-sm flex flex-col gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Serviços</h3>
            <p className="text-muted-foreground text-sm">Visualize e edite serviços cadastrados</p>
          </div>
          <Link href="/dashboard/admin/services" className="text-sm font-medium text-primary hover:underline mt-auto">
            Acessar →
          </Link>
        </Card>

        <Card className="p-6 rounded-3xl border-border/50 shadow-sm flex flex-col gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Usuários</h3>
            <p className="text-muted-foreground text-sm">Gerencie clientes e prestadores</p>
          </div>
          <Link href="/dashboard/admin/users" className="text-sm font-medium text-primary hover:underline mt-auto">
            Acessar →
          </Link>
        </Card>

        <Card className="p-6 rounded-3xl border-border/50 shadow-sm flex flex-col gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Atividade</h3>
            <p className="text-muted-foreground text-sm">Logs e estatísticas do sistema</p>
          </div>
          <Link href="#" className="text-sm font-medium text-primary hover:underline mt-auto">
            Em breve →
          </Link>
        </Card>
      </div>
    </div>
  );
}
