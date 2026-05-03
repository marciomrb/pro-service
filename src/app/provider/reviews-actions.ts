'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitReview(formData: {
  providerId: string
  comment: string
  rating_punctuality: number
  rating_quality: number
  rating_price: number
  images?: string[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be logged in to leave a review')
  }

  // Calculate weighted rating: Quality (50%), Punctuality (30%), Price (20%)
  const rating = (formData.rating_quality * 0.5) + (formData.rating_punctuality * 0.3) + (formData.rating_price * 0.2)

  // Insert review
  const { data: review, error: reviewError } = await supabase
    .from('reviews')
    .insert({
      client_id: user.id,
      provider_id: formData.providerId,
      rating: rating,
      rating_punctuality: formData.rating_punctuality,
      rating_quality: formData.rating_quality,
      rating_price: formData.rating_price,
      comment: formData.comment,
    })
    .select()
    .single()

  if (reviewError) {
    console.error('Error submitting review:', reviewError)
    throw new Error('Failed to submit review')
  }

  // Insert images if any
  if (formData.images && formData.images.length > 0) {
    const imagesToInsert = formData.images.map(url => ({
      review_id: review.id,
      image_url: url
    }))

    const { error: imagesError } = await supabase
      .from('review_images')
      .insert(imagesToInsert)

    if (imagesError) {
      console.error('Error submitting review images:', imagesError)
      // We don't throw here to not break the whole review submission if only images fail
    }
  }

  revalidatePath(`/provider/${formData.providerId}`)
}
