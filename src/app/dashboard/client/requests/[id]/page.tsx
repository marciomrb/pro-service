import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Star, CheckCircle2, XCircle, MessageSquare, ArrowLeft, Clock } from 'lucide-react'
import Link from 'next/link'
import {
  acceptOffer as _acceptOffer,
  rejectOffer as _rejectOffer,
  confirmCompletion as _confirmCompletion,
  cancelRequest as _cancelRequest,
  submitReview as _submitReview,
} from '@/actions/service-request-actions'

// ─── Void wrappers required by Next.js form action type ───────────────────────
async function doAcceptOffer(offerId: string): Promise<void> {
  'use server'
  await _acceptOffer(offerId)
}
async function doRejectOffer(offerId: string): Promise<void> {
  'use server'
  await _rejectOffer(offerId)
}
async function doConfirmCompletion(requestId: string): Promise<void> {
  'use server'
  await _confirmCompletion(requestId)
}
async function doCancelRequest(requestId: string): Promise<void> {
  'use server'
  await _cancelRequest(requestId)
}
async function doSubmitReview(formData: FormData): Promise<void> {
  'use server'
  const requestId = formData.get('requestId') as string
  const providerId = formData.get('providerId') as string
  await _submitReview({
    requestId,
    providerId,
    rating: Number(formData.get('rating')),
    comment: formData.get('comment') as string,
  })
}
// ──────────────────────────────────────────────────────────────────────────────

const steps = [
  { key: 'open', label: 'Aberta' },
  { key: 'matched', label: 'Proposta Aceita' },
  { key: 'in_progress', label: 'Em Andamento' },
  { key: 'pending_completion', label: 'Aguardando Confirmação' },
  { key: 'completed', label: 'Concluída' },
]

function StatusTimeline({ status }: { status: string }) {
  const currentIndex = steps.findIndex((s) => s.key === status)
  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-2">
      {steps.map((step, i) => {
        const done = i < currentIndex
        const active = i === currentIndex
        return (
          <div key={step.key} className="flex items-center gap-0 shrink-0">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  done
                    ? 'bg-primary text-white'
                    : active
                    ? 'bg-primary/20 text-primary ring-2 ring-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-[10px] font-medium whitespace-nowrap ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-8 sm:w-12 mb-4 mx-0.5 transition-all ${done ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default async function ClientRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: request } = await supabase
    .from('service_requests')
    .select(`
      *,
      categories!category_id(name, icon),
      service_request_offers!service_request_id(
        id,
        budget_offer,
        message,
        status,
        created_at,
        provider_profiles:provider_id(
          id,
          profession_title,
          rating,
          reviews_count,
          profiles(full_name, avatar_url)
        )
      )
    `)
    .eq('id', id)
    .eq('client_id', user.id)
    .single()

  if (!request) notFound()

  const offers = request.service_request_offers || []
  const pendingOffers = offers.filter((o: any) => o.status === 'pending')
  const acceptedOffer = offers.find((o: any) => o.status === 'accepted')
  const acceptedProviderId = acceptedOffer?.provider_profiles?.id

  const urgencyLabel: Record<string, string> = {
    normal: 'Normal (sem urgência)',
    medium: 'Média (próximos dias)',
    high: '🔥 Alta (urgente/hoje)',
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      {/* Header */}
      <div>
        <Link href="/dashboard/client/requests" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Voltar às solicitações
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{request.title}</h1>
            <p className="text-muted-foreground mt-1">{request.description}</p>
          </div>
          {request.status === 'open' && (
            <form action={doCancelRequest.bind(null, id)}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 rounded-xl shrink-0"
                onClick={(e) => {
                  if (!confirm('Cancelar esta solicitação?')) e.preventDefault()
                }}
              >
                <XCircle className="w-4 h-4 mr-1" /> Cancelar
              </Button>
            </form>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mt-4 text-sm text-muted-foreground">
          {request.categories && (
            <span className="bg-muted px-3 py-1 rounded-full text-xs">
              {request.categories.icon} {request.categories.name}
            </span>
          )}
          {request.budget && (
            <span className="font-semibold text-foreground">Orçamento: R$ {request.budget}</span>
          )}
          <span>{urgencyLabel[request.urgency] || request.urgency}</span>
        </div>
      </div>

      {/* Status Timeline */}
      {request.status !== 'closed' && (
        <Card className="p-6 rounded-2xl">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Progresso</h2>
          <StatusTimeline status={request.status} />
        </Card>
      )}

      {/* Confirm Completion CTA */}
      {request.status === 'pending_completion' && (
        <Card className="p-6 rounded-2xl bg-green-500/5 border-green-500/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">O profissional finalizou o serviço!</h3>
              <p className="text-muted-foreground text-sm mt-1">Confirme a conclusão para liberar o pagamento e deixar sua avaliação.</p>
              <form action={doConfirmCompletion.bind(null, id)} className="mt-4">
                <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white rounded-xl gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Confirmar Conclusão
                </Button>
              </form>
            </div>
          </div>
        </Card>
      )}

      {/* Review Form */}
      {request.status === 'completed' && acceptedProviderId && (
        <Card className="p-6 rounded-2xl space-y-4">
          <h2 className="text-xl font-bold">Avaliar Profissional</h2>
          <form action={doSubmitReview} className="space-y-4">
            <input type="hidden" name="requestId" value={id} />
            <input type="hidden" name="providerId" value={acceptedProviderId} />
            <div>
              <label className="text-sm font-medium mb-2 block">Nota</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <label key={star} className="cursor-pointer group">
                    <input type="radio" name="rating" value={star} className="sr-only" required />
                    <Star className="w-8 h-8 text-muted-foreground group-hover:fill-yellow-400 group-hover:text-yellow-400 transition-colors" />
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Comentário (opcional)</label>
              <textarea
                name="comment"
                rows={3}
                placeholder="Como foi a experiência com este profissional?"
                className="w-full p-3 bg-muted/20 border border-input rounded-xl focus:ring-2 focus:ring-primary/20 outline-none resize-none text-sm"
              />
            </div>
            <Button type="submit" className="rounded-xl gap-2">
              <Star className="w-4 h-4" /> Enviar Avaliação
            </Button>
          </form>
        </Card>
      )}

      {/* Accepted Provider Card */}
      {acceptedOffer && (
        <Card className="p-5 rounded-2xl border-primary/20 bg-primary/5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Profissional Contratado</h2>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted shrink-0">
              <img
                src={acceptedOffer.provider_profiles?.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(acceptedOffer.provider_profiles?.profiles?.full_name || 'P')}&background=0E5D91&color=fff`}
                alt="Provider"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-bold">{acceptedOffer.provider_profiles?.profiles?.full_name}</h3>
              <p className="text-sm text-muted-foreground">{acceptedOffer.provider_profiles?.profession_title}</p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-semibold">{acceptedOffer.provider_profiles?.rating || 'N/A'}</span>
                <span className="text-xs text-muted-foreground">({acceptedOffer.provider_profiles?.reviews_count || 0} avaliações)</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-extrabold text-primary">R$ {acceptedOffer.budget_offer}</p>
              <p className="text-xs text-muted-foreground">Valor acordado</p>
              <Link href={`/provider/${acceptedOffer.provider_profiles?.id}`}>
                <Button variant="ghost" size="sm" className="text-primary mt-1 h-7 rounded-lg text-xs">
                  Ver perfil
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Pending Offers */}
      {request.status === 'open' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              Propostas Recebidas
              {pendingOffers.length > 0 && (
                <span className="ml-2 text-sm font-normal text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {pendingOffers.length} nova{pendingOffers.length > 1 ? 's' : ''}
                </span>
              )}
            </h2>
          </div>

          {pendingOffers.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground border-dashed border-2 bg-muted/5">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Aguardando propostas...</p>
              <p className="text-sm mt-1">Profissionais da sua área serão notificados e podem enviar propostas.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingOffers.map((offer: any) => (
                <Card key={offer.id} className="p-5 rounded-2xl hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted shrink-0">
                      <img
                        src={offer.provider_profiles?.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(offer.provider_profiles?.profiles?.full_name || 'P')}&background=0E5D91&color=fff`}
                        alt="Provider"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold">{offer.provider_profiles?.profiles?.full_name}</h4>
                          <p className="text-sm text-muted-foreground">{offer.provider_profiles?.profession_title}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs font-medium">{offer.provider_profiles?.rating || 'N/A'}</span>
                            <span className="text-xs text-muted-foreground">({offer.provider_profiles?.reviews_count || 0})</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-2xl font-extrabold text-primary">R$ {offer.budget_offer}</p>
                          <p className="text-xs text-muted-foreground">proposta</p>
                        </div>
                      </div>
                      {offer.message && (
                        <p className="text-sm text-foreground/80 mt-3 p-3 bg-muted/30 rounded-xl italic">
                          &quot;{offer.message}&quot;
                        </p>
                      )}
                      <div className="flex gap-2 mt-4 flex-wrap">
                        <form action={doAcceptOffer.bind(null, offer.id)}>
                          <Button type="submit" size="sm" className="rounded-xl gap-1.5 bg-green-600 hover:bg-green-700 text-white">
                            <CheckCircle2 className="w-4 h-4" /> Aceitar
                          </Button>
                        </form>
                        <form action={doRejectOffer.bind(null, offer.id)}>
                          <Button type="submit" size="sm" variant="outline" className="rounded-xl gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10">
                            <XCircle className="w-4 h-4" /> Recusar
                          </Button>
                        </form>
                        <Link href={`/provider/${offer.provider_profiles?.id}`}>
                          <Button size="sm" variant="ghost" className="rounded-xl gap-1.5 text-primary">
                            <MessageSquare className="w-4 h-4" /> Ver Perfil
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
