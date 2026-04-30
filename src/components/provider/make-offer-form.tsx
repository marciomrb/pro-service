'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { makeOffer } from '@/actions/service-request-actions'
import { Send, X } from 'lucide-react'

export default function MakeOfferForm({
  requestId,
  suggestedBudget,
}: {
  requestId: string
  suggestedBudget: number | null
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = await makeOffer({
      requestId,
      budgetOffer: Number(formData.get('budget')),
      message: formData.get('message') as string,
    })
    setLoading(false)
    if (result.success) {
      setDone(true)
      setOpen(false)
    }
  }

  if (done) {
    return (
      <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
        ✅ Proposta enviada
      </span>
    )
  }

  if (!open) {
    return (
      <Button
        size="sm"
        onClick={() => setOpen(true)}
        className="rounded-xl gap-1.5 text-xs"
      >
        <Send className="w-3.5 h-3.5" /> Fazer Proposta
      </Button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 p-4 bg-muted/30 rounded-2xl border space-y-3"
    >
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">Sua Proposta</h4>
        <button type="button" onClick={() => setOpen(false)}>
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
