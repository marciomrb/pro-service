'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Ticket, 
  Check, 
  X, 
  Clock, 
  AlertCircle, 
  Loader2, 
  Filter,
  Search,
  MoreVertical,
  ChevronRight
} from 'lucide-react'
import { getCouponRequests, updateCouponRequest } from '@/actions/admin-actions'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function AdminCouponsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')
  const [search, setSearch] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [percentage, setPercentage] = useState<number>(10)
  const [adminNotes, setAdminNotes] = useState('')

  useEffect(() => {
    fetchRequests()
  }, [])

  async function fetchRequests() {
    setLoading(true)
    const res = await getCouponRequests()
    if (res.requests) {
      setRequests(res.requests)
    } else {
      toast.error('Erro ao carregar solicitações')
    }
    setLoading(false)
  }

  const filteredRequests = requests.filter(req => {
    const matchesFilter = filter === 'ALL' || req.status === filter
    const matchesSearch = 
      req.profiles.full_name.toLowerCase().includes(search.toLowerCase()) ||
      req.requested_code.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  async function handleUpdateStatus(requestId: string, status: 'APPROVED' | 'REJECTED') {
    if (status === 'APPROVED') {
      const request = requests.find(r => r.id === requestId)
      setSelectedRequest(request)
      setIsModalOpen(true)
      return
    }

    setProcessingId(requestId)
    const res = await updateCouponRequest(requestId, 'REJECTED', undefined, 'Reprovado pelo administrador')
    if (res.success) {
      toast.success('Solicitação rejeitada')
      fetchRequests()
    } else {
      toast.error(res.error || 'Erro ao atualizar')
    }
    setProcessingId(null)
  }

  async function confirmApproval() {
    if (!selectedRequest) return
    setProcessingId(selectedRequest.id)
    
    const res = await updateCouponRequest(
      selectedRequest.id, 
      'APPROVED', 
      percentage, 
      adminNotes
    )

    if (res.success) {
      toast.success('Cupom aprovado e gerado com sucesso!')
      setIsModalOpen(false)
      fetchRequests()
    } else {
      toast.error(res.error || 'Erro ao aprovar')
    }
    setProcessingId(null)
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Gerenciamento de Cupons</h1>
          <p className="text-muted-foreground mt-2">
            Analise e aprove solicitações de desconto dos prestadores.
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-xl border border-border/50">
          {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === f 
                  ? 'bg-background shadow-sm text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f === 'PENDING' ? 'Pendentes' : f === 'APPROVED' ? 'Aprovados' : f === 'REJECTED' ? 'Recusados' : 'Todos'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards (Optional) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Aguardando Análise</p>
              <p className="text-3xl font-bold">{requests.filter(r => r.status === 'PENDING').length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-green-500/5 to-transparent border-green-500/10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-xl">
              <Check className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Aprovados</p>
              <p className="text-3xl font-bold">{requests.filter(r => r.status === 'APPROVED').length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Ticket className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Solicitações Totais</p>
              <p className="text-3xl font-bold">{requests.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main List */}
      <Card className="overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm">
        <div className="p-4 border-b border-border/50 bg-muted/20 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por prestador ou código..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-background/80 border-border/50"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Exibindo {filteredRequests.length} solicitações
          </p>
        </div>

        <div className="divide-y divide-border/50">
          <AnimatePresence mode="popLayout">
            {loading ? (
              <div className="p-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-muted-foreground animate-pulse">Carregando solicitações...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="p-20 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Filter className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium">Nenhuma solicitação encontrada</h3>
                <p className="text-muted-foreground">Não há solicitações que correspondam aos filtros selecionados.</p>
              </div>
            ) : (
              filteredRequests.map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 hover:bg-muted/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <Ticket className="w-6 h-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{request.requested_code}</span>
                        <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider">
                          {request.status}
                        </Badge>
                      </div>
                      <p className="font-medium text-foreground">{request.profiles.full_name}</p>
                      <p className="text-xs text-muted-foreground">{request.profiles.email}</p>
                      {request.reason && (
                        <div className="mt-2 p-2 rounded-lg bg-muted/50 text-sm text-muted-foreground border border-border/30">
                          "{request.reason}"
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end gap-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {format(new Date(request.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </div>

                    {request.status === 'PENDING' ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/20"
                          onClick={() => handleUpdateStatus(request.id, 'REJECTED')}
                          disabled={processingId === request.id}
                        >
                          {processingId === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4 mr-2" />}
                          Recusar
                        </Button>
                        <Button
                          size="sm"
                          className="bg-primary hover:bg-primary/90"
                          onClick={() => handleUpdateStatus(request.id, 'APPROVED')}
                          disabled={processingId === request.id}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Analisar & Aprovar
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end">
                        {request.status === 'APPROVED' && (
                          <div className="text-right">
                            <p className="text-sm font-bold text-green-500">
                              Aprovado com {request.approved_percentage}% OFF
                            </p>
                            {request.admin_notes && (
                              <p className="text-xs text-muted-foreground italic">
                                "{request.admin_notes}"
                              </p>
                            )}
                          </div>
                        )}
                        {request.status === 'REJECTED' && (
                          <p className="text-sm font-bold text-red-500">Recusado</p>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </Card>

      {/* Approval Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden"
            >
              <Card className="border-border shadow-2xl p-6 bg-card">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Ticket className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold">Aprovar Cupom</h2>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Prestador</p>
                    <div className="p-3 bg-muted rounded-lg flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                        {selectedRequest?.profiles.full_name[0]}
                      </div>
                      <div>
                        <p className="font-bold">{selectedRequest?.profiles.full_name}</p>
                        <p className="text-xs text-muted-foreground">{selectedRequest?.profiles.email}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Código Requerido</label>
                    <Input value={selectedRequest?.requested_code} disabled className="bg-muted font-mono" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Porcentagem de Desconto</label>
                      <div className="relative">
                        <Input 
                          type="number" 
                          value={percentage} 
                          onChange={(e) => setPercentage(Number(e.target.value))}
                          min={1}
                          max={100}
                          className="pr-10"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">%</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Validade</label>
                      <Input value="30 dias" disabled className="bg-muted" />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Notas do Administrador (Opcional)</label>
                    <Input 
                      placeholder="Ex: Bom trabalho! Aproveite o desconto." 
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button className="flex-1 bg-primary text-primary-foreground" onClick={confirmApproval} disabled={processingId !== null}>
                      {processingId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                      Confirmar Aprovação
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
