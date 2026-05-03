import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  User,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { addTicketResponse, updateTicketStatus } from "@/app/support/actions";
import { redirect } from "next/navigation";

export default async function TicketDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .single();

  const isAdmin = profile?.role === "admin";

  const { data: ticket } = await supabase
    .from("support_tickets")
    .select(
      `
      *,
      profiles:user_id(full_name, avatar_url, role),
      responses:support_ticket_responses(
        *,
        profiles:user_id(full_name, avatar_url, role)
      )
    `,
    )
    .eq("id", params.id)
    .single();

  if (!ticket) {
    redirect("/dashboard/support");
  }

  // Server action handler for new response
  async function handleResponse(formData: FormData) {
    "use server";
    const message = formData.get("message") as string;
    if (!message) return;

    await addTicketResponse(params.id, message, isAdmin);
  }

  async function handleStatusUpdate(formData: FormData) {
    "use server";
    const status = formData.get("status") as string;
    if (!status) return;

    await updateTicketStatus(params.id, status);
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "open":
        return "Aberto";
      case "in_progress":
        return "Em Análise";
      case "resolved":
        return "Resolvido";
      case "closed":
        return "Fechado";
      default:
        return status;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Link
        href="/dashboard/support"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4 w-fit"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar para chamados
      </Link>

      <div className="bg-card rounded-[2rem] border border-border/50 overflow-hidden shadow-xl shadow-primary/5">
        {/* Header */}
        <div className="bg-muted/30 p-8 border-b border-border/50">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge
                  variant="outline"
                  className="rounded-lg bg-background font-bold uppercase tracking-wider text-[10px]"
                >
                  #{ticket.id.slice(0, 8)}
                </Badge>
                <Badge className="bg-primary/10 text-primary border-primary/20 rounded-lg">
                  {getStatusLabel(ticket.status)}
                </Badge>
              </div>
              <h1 className="text-3xl font-black text-foreground">
                {ticket.subject}
              </h1>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground font-medium">
                Aberto em
              </p>
              <p className="font-bold">
                {format(new Date(ticket.created_at), "d 'de' MMMM, yyyy", {
                  locale: ptBR,
                })}
              </p>
            </div>
          </div>

          <div className="bg-background/50 rounded-2xl p-6 border border-border/50">
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">
              {ticket.description}
            </p>
          </div>
        </div>

        {/* Admin Controls */}
        {isAdmin && (
          <div className="bg-muted/10 p-8 border-t border-border/50">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold">Controles Administrativos</h3>
                  <p className="text-sm text-muted-foreground">
                    Altere o status deste chamado para organizar o fluxo de
                    trabalho.
                  </p>
                </div>
              </div>

              <form
                action={handleStatusUpdate}
                className="flex gap-3 w-full md:w-auto"
              >
                <select
                  name="status"
                  defaultValue={ticket.status}
                  className="bg-background rounded-xl border border-border px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="open">Aberto</option>
                  <option value="in_progress">Em Análise</option>
                  <option value="resolved">Resolvido</option>
                  <option value="closed">Fechado</option>
                </select>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-xl font-bold bg-foreground hover:bg-primary text-white"
                >
                  Atualizar
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Responses */}
        <div className="p-8 space-y-8">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" /> Interações
          </h2>

          <div className="space-y-6">
            {ticket.responses?.map((response: any) => (
              <div
                key={response.id}
                className={`flex gap-4 ${response.is_admin_response ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-10 h-10 rounded-xl overflow-hidden shrink-0 border-2 ${response.is_admin_response ? "border-primary shadow-lg shadow-primary/20" : "border-background shadow-sm"}`}
                >
                  <img
                    src={
                      response.profiles?.avatar_url ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${response.profiles?.full_name}`
                    }
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div
                  className={`flex-1 space-y-1 ${response.is_admin_response ? "items-end" : ""}`}
                >
                  <div
                    className={`flex items-center gap-2 mb-1 ${response.is_admin_response ? "flex-row-reverse" : ""}`}
                  >
                    <span className="font-bold text-sm">
                      {response.profiles?.full_name}
                    </span>
                    {response.is_admin_response && (
                      <Badge className="bg-primary text-white text-[10px] h-4 px-1.5 font-black uppercase">
                        Suporte
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(response.created_at), "HH:mm")}
                    </span>
                  </div>
                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      response.is_admin_response
                        ? "bg-primary text-white rounded-tr-none"
                        : "bg-muted/50 text-foreground rounded-tl-none border border-border/50"
                    }`}
                  >
                    {response.message}
                  </div>
                </div>
              </div>
            ))}

            {(!ticket.responses || ticket.responses.length === 0) && (
              <div className="text-center py-8 bg-muted/20 rounded-3xl border border-dashed border-muted/50">
                <p className="text-sm text-muted-foreground font-medium">
                  Aguardando primeira resposta da nossa equipe...
                </p>
              </div>
            )}
          </div>

          {/* New Response Form */}
          {ticket.status !== "closed" && (
            <form action={handleResponse} className="mt-12 space-y-4">
              <div className="relative group">
                <Textarea
                  name="message"
                  placeholder="Escreva sua mensagem..."
                  className="rounded-2xl bg-muted/30 border-muted focus:border-primary transition-all min-h-[120px] resize-none pr-12 pt-4"
                  required
                />
                <div className="absolute top-4 right-4 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <MessageSquare className="w-5 h-5" />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-foreground hover:bg-primary transition-all duration-300 font-bold shadow-lg shadow-primary/10"
              >
                Enviar Resposta
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
