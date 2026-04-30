'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createNotification } from './notification-actions'

export async function createBooking(formData: {
  providerId: string
  date: Date
  description: string
  location?: { lat: number; lng: number }
  address?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const point = formData.location 
    ? `POINT(${formData.location.lng} ${formData.location.lat})`
    : null

  const { error } = await supabase
    .from('bookings')
    .insert({
      client_id: user.id,
      provider_id: formData.providerId,
      booking_date: formData.date.toISOString(),
      description: formData.description,
      status: 'pending',
      location: point,
      address: formData.address
    })

  if (error) {
    console.error('Error creating booking:', error)
    throw new Error('Failed to create booking')
  }

  // Notify Specific Provider
  await createNotification({
    userId: formData.providerId,
    title: 'New Service Booking Request',
    message: `${user.user_metadata?.full_name || 'A client'} requested a service for ${new Date(formData.date).toLocaleDateString()}.${formData.address ? ` Location: ${formData.address}` : ''}`,
  })

  // TODO: Notify nearby providers when location-based matching is implemented

  revalidatePath('/dashboard/client')
  redirect('/dashboard/client?success=booked')
}

export async function updateBookingStatus(bookingId: string, status: 'confirmed' | 'cancelled' | 'completed') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return

  // Get booking details to notify the client
  const { data: booking } = await supabase
    .from('bookings')
    .select('client_id, provider_id')
    .eq('id', bookingId)
    .single()

  const { error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId)

  if (error) {
    console.error('Error updating booking status:', error)
    throw new Error('Failed to update booking status')
  }

  if (booking) {
    const statusMap = {
      confirmed: 'Your booking has been CONFIRMED!',
      cancelled: 'Your booking request was declined.',
      completed: 'The professional marked the service as COMPLETED.',
    }

    await createNotification({
      userId: booking.client_id,
      title: 'Booking Update',
      message: statusMap[status],
    })
  }

  revalidatePath('/dashboard/provider')
}

