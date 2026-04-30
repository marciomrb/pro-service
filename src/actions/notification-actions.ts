'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createNotification({
  userId,
  title,
  message,
}: {
  userId: string
  title: string
  message: string
}) {
  const supabase = await createClient()

  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    title,
    message,
    is_read: false,
  })

  if (error) {
    console.error('Error creating notification:', error)
  }
}

export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)

  if (error) {
    console.error('Error marking notification as read:', error)
  }

  revalidatePath('/dashboard')
}

export async function markAllNotificationsAsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)

  if (error) {
    console.error('Error marking all notifications as read:', error)
  }

  revalidatePath('/dashboard')
}
