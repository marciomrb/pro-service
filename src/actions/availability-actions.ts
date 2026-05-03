'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type AvailabilitySlot = {
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}

export type BlockedDate = {
  id: string
  blocked_date: string
  reason?: string
}

export async function getProviderAvailability(providerId?: string) {
  const supabase = await createClient()
  
  let targetId = providerId
  if (!targetId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    targetId = user.id
  }

  const { data, error } = await supabase
    .from('provider_availability')
    .select('*')
    .eq('provider_id', targetId)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Error fetching availability:', error)
    return []
  }

  return data || []
}

export async function saveAvailabilityAction(slots: AvailabilitySlot[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Não autenticado' }

  // Check if user is a provider
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'provider') {
    return { error: 'Apenas prestadores podem gerenciar disponibilidade' }
  }

  // Delete existing availability for this provider to overwrite
  const { error: deleteError } = await supabase
    .from('provider_availability')
    .delete()
    .eq('provider_id', user.id)

  if (deleteError) {
    console.error('Error deleting old availability:', deleteError)
    return { error: 'Erro ao atualizar disponibilidade' }
  }

  if (slots.length === 0) {
    revalidatePath('/dashboard/provider/availability')
    return { success: true }
  }

  // Insert new slots
  const { error: insertError } = await supabase
    .from('provider_availability')
    .insert(
      slots.map(slot => ({
        ...slot,
        provider_id: user.id
      }))
    )

  if (insertError) {
    console.error('Error inserting availability:', insertError)
    return { error: 'Erro ao salvar disponibilidade' }
  }

  revalidatePath('/dashboard/provider/availability')
  return { success: true }
}

export async function getBlockedDates(providerId?: string) {
  const supabase = await createClient()
  
  let targetId = providerId
  if (!targetId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    targetId = user.id
  }

  const { data, error } = await supabase
    .from('provider_blocked_dates')
    .select('*')
    .eq('provider_id', targetId)
    .order('blocked_date', { ascending: true })

  if (error) {
    console.error('Error fetching blocked dates:', error)
    return []
  }

  return data || []
}

export async function toggleBlockedDateAction(date: string, reason?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Não autenticado' }

  // Check if date is already blocked
  const { data: existing } = await supabase
    .from('provider_blocked_dates')
    .select('id')
    .eq('provider_id', user.id)
    .eq('blocked_date', date)
    .single()

  if (existing) {
    // Unblock
    const { error } = await supabase
      .from('provider_blocked_dates')
      .delete()
      .eq('id', existing.id)

    if (error) return { error: 'Erro ao desbloquear data' }
  } else {
    // Block
    const { error } = await supabase
      .from('provider_blocked_dates')
      .insert({
        provider_id: user.id,
        blocked_date: date,
        reason
      })

    if (error) return { error: 'Erro ao bloquear data' }
  }

  revalidatePath('/dashboard/provider/availability')
  return { success: true }
}
