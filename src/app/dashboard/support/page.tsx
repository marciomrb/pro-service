import { createClient } from '@/lib/supabase/server'
import { SupportTicketForm } from '@/components/support/support-ticket-form'
import { Badge } from "@/components/ui/badge"
import { 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FAQSection } from '@/components/support/faq-section'

export default async function SupportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Clock className="w-4 h-4 text-blue-500" />
      case 'in_progress': return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case 'resolved': return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'closed': return <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
      default: return null
    }
  }

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
      case 'low': return 'bg-blue-500/10 text-blue-600 border-blue-200'
      case 'medium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-200'
      case 'high': return 'bg-orange-500/10 text-orange-600 border-orange-200'
      case 'critical': return 'bg-red-500/10 text-red-600 border-red-200'
      default: return ''
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left: Form */}
        <div className="w-full md:w-1/2">
          <SupportTicketForm />
        </div>

        {/* Right: History */}
        <div className="w-full md:w-1/2 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold">Meus Chamados</h2>
            <Badge variant="outline" className="rounded-lg">{tickets?.length || 0} Total</Badge>
          </div>

          <div className="space-y-4">
            {tickets && tickets.length > 0 ? (
              tickets.map((ticket) => (
                <Link 
                  key={ticket.id} 
                  href={`/dashboard/support/${ticket.id}`}
                  className="block group bg-card rounded-2xl border border-border/50 p-5 hover:border-primary/50 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(ticket.status)}
                      <span className="text-sm font-bold">{getStatusLabel(ticket.status)}</span>
                    </div>
                    <Badge className={`text-[10px] uppercase ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </Badge>
                  </div>
                  
                  <h3 className="font-bold text-foreground group-hover:text-primary transition-colors mb-1">
                    {ticket.subject}
                  </h3>
                  
                  <div className="flex items-center justify-between mt-4 text-[11px] text-muted-foreground font-medium">
                    <div className="flex items-center gap-3">
                      <span className="bg-muted px-2 py-0.5 rounded uppercase tracking-wider">{ticket.category}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(ticket.created_at), "d 'de' MMM, HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="bg-muted/30 rounded-3xl border border-dashed border-muted p-12 text-center">
                <div className="bg-background w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="font-bold text-foreground mb-1">Nenhum chamado aberto</h3>
                <p className="text-sm text-muted-foreground">Sempre que tiver uma dúvida ou problema, abra um chamado ao lado.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-border/50 pt-12">
        <FAQSection />
      </div>
    </div>
  )
}
