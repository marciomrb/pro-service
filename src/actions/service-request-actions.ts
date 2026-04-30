'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createNotification } from './notification-actions'

// ─────────────────────────────────────────────
// CLIENT: Criar solicitação e notificar providers
// ─────────────────────────────────────────────
export async function createServiceRequest(formData: {
  title: string
  description: string
  category_id: string
  budget: number | string | null
  urgency: string
  location?: { lat: number; lng: number }
  address?: string
  street_number?: string
  latitude?: number
  longitude?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Parse budget correctly
  let numericBudget: number | null = null
  if (formData.budget !== null && formData.budget !== '') {
    numericBudget = typeof formData.budget === 'string' ? parseFloat(formData.budget) : formData.budget
    if (isNaN(numericBudget)) numericBudget = null
  }

  // PostGIS point format: 'POINT(lng lat)'
  const locationPoint = formData.location 
    ? `POINT(${formData.location.lng} ${formData.location.lat})` 
    : null

  const { data: request, error } = await supabase
    .from('service_requests')
    .insert({
      client_id: user.id,
      title: formData.title,
      description: formData.description,
      category_id: formData.category_id || null,
      budget: numericBudget,
      urgency: formData.urgency || 'normal',
      status: 'open',
      location: locationPoint,
      address: formData.address || null,
      street_number: formData.street_number || null,
      latitude: formData.latitude || (formData.location?.lat) || null,
      longitude: formData.longitude || (formData.location?.lng) || null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating service request:', error)
    return { success: false, error: `Erro do banco: ${error.message}` }
  }

  if (!request) {
    return { success: false, error: 'A solicitação parece ter sido criada, mas o ID não foi retornado.' }
  }

  // Notificar providers
  try {
    let providersToNotify: any[] = []

    if (formData.location) {
      // Find nearby providers first
      const { data: nearbyProviders } = await supabase.rpc('find_nearby_providers', {
        request_lat: formData.location.lat,
        request_lng: formData.location.lng,
        radius_meters: 15000 // 15km for notifications
      })

      if (nearbyProviders && nearbyProviders.length > 0) {
        // Filter by category if needed
        providersToNotify = formData.category_id 
          ? nearbyProviders.filter((p: any) => p.category_id === formData.category_id)
          : nearbyProviders
      }
    }

    // Fallback: if no location or no nearby providers, notify by category (original logic)
    if (providersToNotify.length === 0) {
      let providerQuery = supabase
        .from('provider_profiles')
        .select('id')
        .eq('subscription_status', 'active')

      if (formData.category_id) {
        providerQuery = providerQuery.eq('category_id', formData.category_id)
      }

      const { data: categoryProviders } = await providerQuery
      if (categoryProviders) providersToNotify = categoryProviders
    }

    const urgencyLabel: Record<string, string> = {
      normal: 'sem urgência',
      medium: 'urgência média',
      high: 'URGENTE',
    }

    if (providersToNotify && providersToNotify.length > 0) {
      // Limitar a 50 notificações
      const finalProviders = providersToNotify
        .filter((p) => p.id !== user.id)
        .slice(0, 50)

      await Promise.all(
        finalProviders.map((p) =>
          createNotification({
            userId: p.id,
            title: '📍 Nova solicitação próxima',
            message: `"${formData.title}" — ${urgencyLabel[formData.urgency] || 'normal'}${numericBudget ? ` — Orçamento: R$ ${numericBudget}` : ''}. Acesse para fazer uma proposta!`,
          })
        )
      )
    }
  } catch (notifyError) {
    console.error('Error notifying providers:', notifyError)
  }

  revalidatePath('/dashboard/client')
  revalidatePath('/dashboard/client/requests')
  return { success: true, requestId: request.id }
}

// ─────────────────────────────────────────────
// PROVIDER: Fazer uma proposta em um request
// ─────────────────────────────────────────────
export async function makeOffer(formData: {
  requestId: string
  budgetOffer: number
  message: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Buscar dados do request para notificar o cliente
  const { data: request } = await supabase
    .from('service_requests')
    .select('client_id, title')
    .eq('id', formData.requestId)
    .single()

  const { error } = await supabase
    .from('service_request_offers')
    .upsert({
      service_request_id: formData.requestId,
      provider_id: user.id,
      budget_offer: formData.budgetOffer,
      message: formData.message,
      status: 'pending',
    }, { onConflict: 'service_request_id,provider_id' })

  if (error) {
    console.error('Error making offer:', error)
    return { success: false, error: 'Falha ao enviar proposta.' }
  }

  // Buscar nome do provider
  const { data: providerProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  // Notificar o cliente
  if (request) {
    await createNotification({
      userId: request.client_id,
      title: '💼 Nova proposta recebida!',
      message: `${providerProfile?.full_name || 'Um profissional'} fez uma proposta de R$ ${formData.budgetOffer} para "${request.title}".`,
    })
  }

  revalidatePath('/dashboard/provider/requests')
  return { success: true }
}

// ─────────────────────────────────────────────
// CLIENT: Aceitar uma proposta
// ─────────────────────────────────────────────
export async function acceptOffer(offerId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  // Buscar a oferta e o request
  const { data: offer } = await supabase
    .from('service_request_offers')
    .select('*, service_requests!service_request_id(client_id, title)')
    .eq('id', offerId)
    .single()

  if (!offer) return { error: 'Proposta não encontrada' }
  if ((offer.service_requests as any).client_id !== user.id) return { error: 'Sem permissão' }

  // Atualizar a oferta aceita
  await supabase
    .from('service_request_offers')
    .update({ status: 'accepted' })
    .eq('id', offerId)

  // Rejeitar as outras ofertas do mesmo request
  await supabase
    .from('service_request_offers')
    .update({ status: 'rejected' })
    .eq('service_request_id', offer.service_request_id)
    .neq('id', offerId)

  // Atualizar o request para matched
  await supabase
    .from('service_requests')
    .update({
      status: 'matched',
      accepted_offer_id: offerId,
    })
    .eq('id', offer.service_request_id)

  // Criar ou recuperar chat entre cliente e provider
  const { data: existingChat } = await supabase
    .from('chats')
    .select('id')
    .eq('client_id', user.id)
    .eq('provider_id', offer.provider_id)
    .single()

  if (!existingChat) {
    await supabase.from('chats').insert({
      client_id: user.id,
      provider_id: offer.provider_id,
    })
  }

  // Notificar o provider
  await createNotification({
    userId: offer.provider_id,
    title: '🎉 Proposta aceita!',
    message: `Sua proposta de R$ ${offer.budget_offer} para "${(offer.service_requests as any).title}" foi aceita. Inicie o serviço quando estiver pronto!`,
  })

  revalidatePath(`/dashboard/client/requests/${offer.service_request_id}`)
  return { success: true }
}

// ─────────────────────────────────────────────
// CLIENT: Rejeitar uma proposta
// ─────────────────────────────────────────────
export async function rejectOffer(offerId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: offer } = await supabase
    .from('service_request_offers')
    .select('provider_id, budget_offer, service_requests!service_request_id(client_id, title)')
    .eq('id', offerId)
    .single()

  if (!offer) return { error: 'Proposta não encontrada' }
  if ((offer.service_requests as any).client_id !== user.id) return { error: 'Sem permissão' }

  await supabase
    .from('service_request_offers')
    .update({ status: 'rejected' })
    .eq('id', offerId)

  await createNotification({
    userId: offer.provider_id,
    title: '❌ Proposta recusada',
    message: `Sua proposta de R$ ${offer.budget_offer} para "${(offer.service_requests as any).title}" foi recusada pelo cliente.`,
  })

  revalidatePath(`/dashboard/client/requests`)
  return { success: true }
}

// ─────────────────────────────────────────────
// PROVIDER: Marcar serviço como em andamento
// ─────────────────────────────────────────────
export async function markInProgress(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  // Verificar que o provider é o aceito
  const { data: offer } = await supabase
    .from('service_request_offers')
    .select('service_requests!service_request_id(client_id, title)')
    .eq('service_request_id', requestId)
    .eq('provider_id', user.id)
    .eq('status', 'accepted')
    .single()

  if (!offer) return { error: 'Sem permissão para este serviço' }

  await supabase
    .from('service_requests')
    .update({ status: 'in_progress' })
    .eq('id', requestId)

  await createNotification({
    userId: (offer.service_requests as any).client_id,
    title: '🔧 Serviço iniciado!',
    message: `O profissional começou a trabalhar em "${(offer.service_requests as any).title}".`,
  })

  revalidatePath('/dashboard/provider/requests')
  return { success: true }
}

// ─────────────────────────────────────────────
// PROVIDER: Marcar serviço como concluído (aguarda confirmação do cliente)
// ─────────────────────────────────────────────
export async function markCompletedByProvider(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: offer } = await supabase
    .from('service_request_offers')
    .select('service_requests!service_request_id(client_id, title)')
    .eq('service_request_id', requestId)
    .eq('provider_id', user.id)
    .eq('status', 'accepted')
    .single()

  if (!offer) return { error: 'Sem permissão para este serviço' }

  await supabase
    .from('service_requests')
    .update({ status: 'pending_completion' })
    .eq('id', requestId)

  await createNotification({
    userId: (offer.service_requests as any).client_id,
    title: '✅ Serviço finalizado pelo profissional!',
    message: `"${(offer.service_requests as any).title}" foi marcado como concluído. Confirme a conclusão e deixe sua avaliação!`,
  })

  revalidatePath('/dashboard/provider/requests')
  return { success: true }
}

// ─────────────────────────────────────────────
// CLIENT: Confirmar conclusão do serviço
// ─────────────────────────────────────────────
export async function confirmCompletion(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: request } = await supabase
    .from('service_requests')
    .select('client_id, title, accepted_offer_id')
    .eq('id', requestId)
    .single()

  if (!request || request.client_id !== user.id) return { error: 'Sem permissão' }

  await supabase
    .from('service_requests')
    .update({ status: 'completed' })
    .eq('id', requestId)

  // Buscar o provider da oferta aceita
  if (request.accepted_offer_id) {
    const { data: offer } = await supabase
      .from('service_request_offers')
      .select('provider_id')
      .eq('id', request.accepted_offer_id)
      .single()

    if (offer) {
      await createNotification({
        userId: offer.provider_id,
        title: '🏆 Serviço confirmado!',
        message: `O cliente confirmou a conclusão de "${request.title}". Obrigado pelo seu trabalho!`,
      })
    }
  }

  revalidatePath(`/dashboard/client/requests/${requestId}`)
  return { success: true }
}

// ─────────────────────────────────────────────
// CLIENT: Cancelar uma solicitação
// ─────────────────────────────────────────────
export async function cancelRequest(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  await supabase
    .from('service_requests')
    .update({ status: 'closed' })
    .eq('id', requestId)
    .eq('client_id', user.id)

  revalidatePath('/dashboard/client/requests')
  return { success: true }
}

// ─────────────────────────────────────────────
// CLIENT: Deixar avaliação após conclusão
// ─────────────────────────────────────────────
export async function submitReview(formData: {
  requestId: string
  providerId: string
  rating: number
  comment: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  // Verificar se o request foi completado por este cliente
  const { data: request } = await supabase
    .from('service_requests')
    .select('client_id, status')
    .eq('id', formData.requestId)
    .single()

  if (!request || request.client_id !== user.id || request.status !== 'completed') {
    return { error: 'Avaliação não permitida para este serviço.' }
  }

  // Verificar se client_profiles existe para este usuário
  const { data: clientProfile } = await supabase
    .from('client_profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!clientProfile) {
    // Criar client_profile se não existir
    await supabase.from('client_profiles').insert({ id: user.id })
  }

  const { error } = await supabase.from('reviews').insert({
    provider_id: formData.providerId,
    client_id: user.id,
    rating: formData.rating,
    comment: formData.comment,
  })

  if (error) {
    console.error('Error submitting review:', error)
    return { error: 'Falha ao enviar avaliação.' }
  }

  // Recalcular rating médio do provider
  const { data: reviews } = await supabase
    .from('reviews')
    .select('rating')
    .eq('provider_id', formData.providerId)

  if (reviews && reviews.length > 0) {
    const avg = reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
    await supabase
      .from('provider_profiles')
      .update({
        rating: Math.round(avg * 10) / 10,
        reviews_count: reviews.length,
      })
      .eq('id', formData.providerId)
  }

  await createNotification({
    userId: formData.providerId,
    title: '⭐ Nova avaliação recebida!',
    message: `Você recebeu ${formData.rating} estrela${formData.rating > 1 ? 's' : ''} de um cliente.`,
  })

  revalidatePath(`/dashboard/client/requests/${formData.requestId}`)
  return { success: true }
}
