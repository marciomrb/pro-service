'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createTicket } from '@/app/support/actions'
import { toast } from 'sonner'
import { Loader2, Send, HelpCircle } from 'lucide-react'

export function SupportTicketForm() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'technical',
    priority: 'low'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await createTicket(formData)
      toast.success('Ticket criado com sucesso! Nossa equipe entrará em contato em breve.')
      setFormData({
        subject: '',
        description: '',
        category: 'technical',
        priority: 'low'
      })
    } catch (error) {
      toast.error('Erro ao criar ticket. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card rounded-[2rem] border border-border/50 p-8 shadow-xl shadow-primary/5">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary/10 p-2.5 rounded-2xl">
          <HelpCircle className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Abrir Chamado</h2>
          <p className="text-sm text-muted-foreground">Descreva seu problema ou dúvida</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold ml-1">Assunto</label>
          <Input
            placeholder="Ex: Problema com pagamento, Dúvida sobre perfil..."
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            required
            className="rounded-xl bg-muted/30 border-muted focus:border-primary transition-all h-12"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-bold ml-1">Categoria</label>
            <Select
              value={formData.category}
              onValueChange={(val) => setFormData({ ...formData, category: val })}
            >
              <SelectTrigger className="rounded-xl h-12 bg-muted/30 border-muted">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technical">Problema Técnico</SelectItem>
                <SelectItem value="billing">Financeiro / Cobrança</SelectItem>
                <SelectItem value="complaint">Denúncia / Reclamação</SelectItem>
                <SelectItem value="other">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold ml-1">Urgência</label>
            <Select
              value={formData.priority}
              onValueChange={(val) => setFormData({ ...formData, priority: val })}
            >
              <SelectTrigger className="rounded-xl h-12 bg-muted/30 border-muted">
                <SelectValue placeholder="Selecione a prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="critical">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold ml-1">Descrição Detalhada</label>
          <Textarea
            placeholder="Conte-nos o que está acontecendo..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            className="rounded-xl bg-muted/30 border-muted focus:border-primary transition-all min-h-[150px] resize-none"
          />
        </div>

        <Button 
          type="submit" 
          className="w-full h-12 rounded-xl bg-primary hover:bg-accent text-white font-bold transition-all shadow-lg shadow-primary/20"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Enviar Chamado
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
