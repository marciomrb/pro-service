'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { makeOffer, acceptRequestDirectly } from '@/actions/service-request-actions'
import { Send, X, CheckCircle, MessageSquare } from 'lucide-react'

export default function MakeOfferForm({
  requestId,
  suggestedBudget,
}: {
  requestId: string
  suggestedBudget: number | null
}) {
  const [mode, setMode] = useState<'idle' | 'accept' | 'proposal'>('idle')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState<'accepted' | 'proposal' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleAccept(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const result = await acceptRequestDirectly({
      requestId,
      message: (formData.get('message') as string) || undefined,
    })
    setLoading(false)
    if (result.success) {
      setDone('accepted')
      setMode('idle')
    } else {
      setError(result.error || 'Erro ao aceitar solicitação.')
    }
  }

  async function handleProposal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const result = await makeOffer({
      requestId,
      budgetOffer: Number(formData.get('budget')),
      message: formData.get('message') as string,
    })
    setLoading(false)
    if (result.success) {
      setDone('proposal')
      setMode('idle')
    } else {
      setError(result.error || 'Erro ao enviar proposta.')
    }
  }

  if (done === 'accepted') {
    return (
      <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 inline-flex items-center gap-1.5">
        <CheckCircle className="w-3.5 h-3.5" />
        Serviço aceito — aguardando início
      </span>
    )
  }

  if (done === 'proposal') {
    return (
      <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 inline-flex items-center gap-1.5">
        <Send className="w-3.5 h-3.5" />
        Proposta enviada
      </span>
    )
  }

  // Buttons view (idle mode)
  if (mode === 'idle') {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          onClick={() => setMode('accept')}
          className="rounded-xl gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          Aceitar{suggestedBudget ? ` R$ ${suggestedBudget}` : ''}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setMode('proposal')}
          className="rounded-xl gap-1.5 text-xs"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Fazer Proposta
        </Button>
      </div>
    )
  }

  // Accept confirmation form
  if (mode === 'accept') {
    return (
      <form
        onSubmit={handleAccept}
        className="mt-3 p-4 bg-green-50/50 dark:bg-green-900/10 rounded-2xl border border-green-200 dark:border-green-800/30 space-y-3"
      >
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm text-green-800 dark:text-green-300 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" />
            Aceitar Serviço
          </h4>
          <button type="button" onClick={() => { setMode('idle'); setError(null) }}>
            <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        {suggestedBudget ? (
          <p className="text-sm text-green-700 dark:text-green-400">
            Você aceita realizar este serviço por{' '}
            <strong className="text-base">R$ {suggestedBudget}</strong>
            {' '}(orçamento do cliente).
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            O cliente não definiu orçamento. O valor será combinado pelo chat.
          </p>
        )}

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Mensagem (opcional)
          </label>
          <textarea
            name="message"
            rows={2}
            placeholder="Ex: Posso ir amanhã de manhã..."
            className="w-full p-3 bg-background border border-input rounded-xl text-sm focus:ring-2 focus:ring-green-500/20 outline-none resize-none"
          />
        </div>

        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
        )}

        <Button
          type="submit"
          disabled={loading}
          size="sm"
          className="w-full rounded-xl gap-1.5 bg-green-600 hover:bg-green-700 text-white"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          {loading ? 'Aceitando...' : 'Confirmar Aceite'}
        </Button>
      </form>
    )
  }

  // Proposal form
  return (
    <form
      onSubmit={handleProposal}
      className="mt-3 p-4 bg-muted/30 rounded-2xl border space-y-3"
    >
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">Sua Proposta</h4>
        <button type="button" onClick={() => { setMode('idle'); setError(null) }}>
          <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
        </button>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          Seu Orçamento (R$)
        </label>
        <input
          name="budget"
          type="number"
          min="1"
          step="0.01"
          required
          defaultValue={suggestedBudget ?? ''}
          placeholder="Ex: 350"
          className="w-full h-10 px-3 bg-background border border-input rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          Mensagem para o cliente
        </label>
        <textarea
          name="message"
          rows={2}
          placeholder="Apresente-se e descreva como vai resolver o problema..."
          className="w-full p-3 bg-background border border-input rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none"
        />
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
      )}

      <Button
        type="submit"
        disabled={loading}
        size="sm"
        className="w-full rounded-xl gap-1.5"
      >
        <Send className="w-3.5 h-3.5" />
        {loading ? 'Enviando...' : 'Enviar Proposta'}
      </Button>
    </form>
  )
}
