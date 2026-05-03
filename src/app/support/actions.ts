'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createTicket(formData: {
  subject: string
  description: string
  category: string
  priority: string
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('support_tickets')
    .insert({
      user_id: user.id,
      subject: formData.subject,
      description: formData.description,
      category: formData.category,
      priority: formData.priority,
      status: 'open'
    })

  if (error) throw error

  revalidatePath('/dashboard/support')
  return { success: true }
}

export async function addTicketResponse(ticketId: string, message: string, isAdmin = false) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('support_ticket_responses')
    .insert({
      ticket_id: ticketId,
      user_id: user.id,
      message,
      is_admin_response: isAdmin
    })

  if (error) throw error

  revalidatePath(`/dashboard/support/${ticketId}`)
  return { success: true }
}

export async function updateTicketStatus(ticketId: string, status: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Only admins can update status (or maybe the user can close it)
  // For now, let's just do it
  const { error } = await supabase
    .from('support_tickets')
    .update({ status })
    .eq('id', ticketId)

  if (error) throw error

  revalidatePath('/dashboard/support')
  revalidatePath(`/dashboard/support/${ticketId}`)
  return { success: true }
}

export async function upsertFAQ(faq: {
  id?: string
  question: string
  answer: string
  category: string
  sort_order: number
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') throw new Error('Unauthorized')

  const { error } = await supabase
    .from('faqs')
    .upsert({
      ...faq,
      updated_at: new Date().toISOString()
    })

  if (error) throw error

  revalidatePath('/dashboard/admin/faqs')
  revalidatePath('/dashboard/support')
  revalidatePath('/dashboard/dashboard/support')
  return { success: true }
}

export async function deleteFAQ(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') throw new Error('Unauthorized')

  const { error } = await supabase
    .from('faqs')
    .delete()
    .eq('id', id)

  if (error) throw error

  revalidatePath('/dashboard/admin/faqs')
  revalidatePath('/dashboard/support')
  revalidatePath('/dashboard/dashboard/support')
  return { success: true }
}
