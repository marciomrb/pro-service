import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Tags, Briefcase, Users, MessageSquare, HelpCircle } from "lucide-react";
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

  const [
    { count: usersCount },
    { count: ticketsCount },
    { count: servicesCount },
    { count: verificationCount }
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("support_tickets").select("*", { count: "exact", head: true }),
    supabase.from("provider_services").select("*", { count: "exact", head: true }),
    supabase.from("provider_verifications").select("*", { count: "exact", head: true }).eq("status", "pending")
  ]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Painel Administrativo</h1>
          <p className="text-muted-foreground mt-1">Visão geral do sistema e atalhos rápidos.</p>
        </div>
        <div className="flex gap-4">
          <div className="px-4 py-2 bg-primary/5 border border-primary/10 rounded-2xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Usuários</p>
            <p className="text-xl font-black text-primary">{usersCount || 0}</p>
          </div>
          <div className="px-4 py-2 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600/60">Pendências</p>
            <p className="text-xl font-black text-amber-600">{verificationCount || 0}</p>
          </div>
          <div className="px-4 py-2 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600/60">Chamados</p>
            <p className="text-xl font-black text-blue-600">{ticketsCount || 0}</p>
          </div>
        </div>
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
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Suporte</h3>
            <p className="text-muted-foreground text-sm">Gerencie chamados de suporte dos usuários</p>
          </div>
          <Link href="/dashboard/admin/tickets" className="text-sm font-medium text-primary hover:underline mt-auto">
            Acessar →
          </Link>
        </Card>

        <Card className="p-6 rounded-3xl border-border/50 shadow-sm flex flex-col gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold">FAQs</h3>
            <p className="text-muted-foreground text-sm">Gerencie a base de conhecimento</p>
          </div>
          <Link href="/dashboard/admin/faqs" className="text-sm font-medium text-primary hover:underline mt-auto">
            Acessar →
          </Link>
        </Card>

        <Card className="p-6 rounded-3xl border-border/50 shadow-sm border-amber-500/20 bg-amber-500/5 flex flex-col gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Verificações</h3>
            <p className="text-muted-foreground text-sm">Analise documentos de prestadores</p>
          </div>
          <Link href="/dashboard/admin/verification" className="text-sm font-medium text-amber-600 hover:underline mt-auto">
            Revisar pendências →
          </Link>
        </Card>
      </div>
    </div>
  );
}
