'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from "next/navigation"

export async function trackProfileView(providerId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Prevent self-views from being counted
  if (user?.id === providerId) return

  await supabase.from('profile_views').insert({
    provider_id: providerId,
    viewer_id: user?.id || null,
  })
}

export async function getOrCreateChat(providerId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if chat already exists
  const { data: existingChat, error: fetchError } = await supabase
    .from('chats')
    .select('id')
    .eq('client_id', user.id)
    .eq('provider_id', providerId)
    .single()

  if (existingChat) {
    redirect(`/dashboard/client/messages/${existingChat.id}`)
  }

  // Create new chat
  const { data: newChat, error: insertError } = await supabase
    .from('chats')
    .insert({
      client_id: user.id,
      provider_id: providerId,
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('Error creating chat:', insertError)
    throw new Error('Failed to start conversation')
  }

  redirect(`/dashboard/client/messages/${newChat.id}`)
}
