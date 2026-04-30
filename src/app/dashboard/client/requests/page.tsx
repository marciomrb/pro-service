import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Clock,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  open: {
    label: "Aberta",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    icon: <Clock className="w-3 h-3" />,
  },
  matched: {
    label: "Proposta Aceita",
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  in_progress: {
    label: "Em Andamento",
    color:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
    icon: <Loader2 className="w-3 h-3" />,
  },
  pending_completion: {
    label: "Aguardando Confirmação",
    color:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  completed: {
    label: "Concluída",
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  closed: {
    label: "Cancelada",
    color: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
    icon: <XCircle className="w-3 h-3" />,
  },
};

const urgencyConfig: Record<string, { label: string; color: string }> = {
  normal: { label: "Normal", color: "text-muted-foreground" },
  medium: { label: "Média", color: "text-yellow-600" },
  high: { label: "🔥 Urgente", color: "text-red-600 font-bold" },
};

export default async function ClientRequestsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: requests, error } = await supabase
    .from("service_requests")
    .select(`
      *,
      categories!category_id(name, icon),
      offers:service_request_offers!service_request_id(id, status)
    `)
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching requests:", error);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Minhas Solicitações
          </h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe seus pedidos de serviço.
          </p>
        </div>
        <Link href="/dashboard/client/requests/new">
          <Button className="gap-2 rounded-xl">
            <Plus className="w-4 h-4" /> Nova Solicitação
          </Button>
        </Link>
      </div>

      {error && (
        <Card className="p-4 border-destructive bg-destructive/10 text-destructive text-sm">
          Erro ao carregar solicitações: {error.message}
        </Card>
      )}

      <div className="flex flex-col gap-2">
        {!requests || requests.length === 0 ? (
          <Card className="p-12 text-center flex flex-col items-center gap-4 border-dashed border-2 bg-muted/10">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                Nenhuma solicitação ainda
              </h3>
              <p className="text-muted-foreground text-sm mt-1">
                Crie sua primeira solicitação e receba propostas de
                profissionais.
              </p>
              <p className="text-[10px] text-muted-foreground/50 mt-4 font-mono">
                ID: {user.id}
              </p>
            </div>
            <Link href="/dashboard/client/requests/new">
              <Button className="gap-2 rounded-xl mt-2">
                <Plus className="w-4 h-4" /> Nova Solicitação
              </Button>
            </Link>
          </Card>
        ) : (
          requests.map((req: any) => {
            const s = statusConfig[req.status] || statusConfig.open;
            const u = urgencyConfig[req.urgency] || urgencyConfig.normal;
            const pendingOffers =
              req.offers?.filter(
                (o: any) => o.status === "pending",
              ).length || 0;

            // Handle categories being returned as an array or object
            const categoryData = Array.isArray(req.categories)
              ? req.categories[0]
              : req.categories;

            return (
              <Link key={req.id} href={`/dashboard/client/requests/${req.id}`}>
                <Card className="p-5 rounded-2xl border hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${s.color}`}
                        >
                          {s.icon} {s.label}
                        </span>
                        {categoryData && (
                          <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
                            {categoryData.icon} {categoryData.name}
                          </span>
                        )}
                        {pendingOffers > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary animate-pulse">
                            {pendingOffers} proposta
                            {pendingOffers > 1 ? "s" : ""} nova
                            {pendingOffers > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                        {req.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {req.description}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        {req.budget && (
                          <span className="font-semibold text-foreground">
                            R$ {req.budget}
                          </span>
                        )}
                        <span className={u.color}>{u.label}</span>
                        <span>
                          {new Date(req.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                  </div>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
