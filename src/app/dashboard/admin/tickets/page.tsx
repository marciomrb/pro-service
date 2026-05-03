import { createClient } from '@/lib/supabase/server'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Search,
  Filter,
  User,
  MoreVertical,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ExportTicketsButton } from '@/components/admin/export-tickets-button'

export default async function AdminTicketsPage() {
  const supabase = await createClient()
  
  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()

  if (profile?.role !== 'admin') {
    return <div>Acesso negado.</div>
  }

  const { data: tickets } = await supabase
    .from('support_tickets')
    .select(`
      *,
      profiles:user_id(full_name, avatar_url, email)
    `)
    .order('created_at', { ascending: false })

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Aberto'
      case 'in_progress': return 'Em Análise'
      case 'resolved': return 'Resolvido'
      case 'closed': return 'Fechado'
      default: return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-blue-500/10 text-blue-600'
      case 'medium': return 'bg-yellow-500/10 text-yellow-600'
      case 'high': return 'bg-orange-500/10 text-orange-600'
      case 'critical': return 'bg-red-500/10 text-red-600'
      default: return ''
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black">Gestão de Chamados</h1>
          <p className="text-muted-foreground font-medium">Gerencie o suporte aos usuários da plataforma</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl font-bold">
            <Filter className="w-4 h-4 mr-2" /> Filtrar
          </Button>
          <ExportTicketsButton tickets={tickets || []} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: tickets?.length || 0, icon: MessageSquare, color: 'text-primary' },
          { label: 'Abertos', value: tickets?.filter(t => t.status === 'open').length || 0, icon: Clock, color: 'text-blue-500' },
          { label: 'Em Análise', value: tickets?.filter(t => t.status === 'in_progress').length || 0, icon: AlertCircle, color: 'text-yellow-500' },
          { label: 'Resolvidos', value: tickets?.filter(t => ['resolved', 'closed'].includes(t.status)).length || 0, icon: CheckCircle2, color: 'text-green-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-card rounded-[1.5rem] border border-border/50 p-6 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            </div>
            <div className={`p-3 rounded-2xl bg-muted/30 ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Tickets List */}
      <div className="bg-card rounded-[2rem] border border-border/50 overflow-hidden shadow-xl shadow-primary/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border/50">
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Usuário</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Assunto</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Status</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Prioridade</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Data</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {tickets?.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-muted/10 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-muted overflow-hidden border border-border/50">
                        <img 
                          src={ticket.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${ticket.profiles?.full_name}`} 
                          alt="Avatar" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-sm leading-none mb-1">{ticket.profiles?.full_name}</p>
                        <p className="text-xs text-muted-foreground font-medium">{ticket.profiles?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="font-bold text-sm text-foreground mb-0.5">{ticket.subject}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/50 px-1.5 py-0.5 rounded w-fit">{ticket.category}</p>
                  </td>
                  <td className="px-6 py-5">
                    <Badge variant="outline" className="rounded-lg font-bold border-border/50">
                      {getStatusLabel(ticket.status)}
                    </Badge>
                  </td>
                  <td className="px-6 py-5">
                    <Badge className={`rounded-lg font-black uppercase text-[10px] ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </Badge>
                  </td>
                  <td className="px-6 py-5 text-sm font-medium text-muted-foreground">
                    {format(new Date(ticket.created_at), "dd/MM/yyyy HH:mm")}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <Link href={`/dashboard/support/${ticket.id}`}>
                      <Button variant="ghost" size="sm" className="rounded-xl hover:bg-primary hover:text-white transition-all font-bold">
                        Atender <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
