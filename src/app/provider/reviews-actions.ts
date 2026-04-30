'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitReview(formData: {
  providerId: string
  rating: number
  comment: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be logged in to leave a review')
  }

  const { error } = await supabase
    .from('reviews')
    .insert({
      client_id: user.id,
      provider_id: formData.providerId,
      rating: formData.rating,
      comment: formData.comment,
    })

  if (error) {
    console.error('Error submitting review:', error)
    throw new Error('Failed to submit review')
  }

  // Update provider rating (Simplified: just revalidate and let DB triggers handle it if any, 
  // or we could manually update here)
  
  revalidatePath(`/provider/${formData.providerId}`)
}
