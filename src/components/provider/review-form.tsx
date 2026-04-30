'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { submitReview } from '@/app/provider/reviews-actions'
import { Card } from '@/components/ui/card'

export default function ReviewForm({ providerId }: { providerId: string }) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) return

    setIsSubmitting(true)
    try {
      await submitReview({ providerId, rating, comment })
      setSubmitted(true)
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <Card className="p-6 bg-green-50 border-green-100 text-center space-y-2">
        <h3 className="font-bold text-green-800">Thank you for your review!</h3>
        <p className="text-sm text-green-700">Your feedback helps the community find the best professionals.</p>
      </Card>
    )
  }

  return (
    <Card className="p-6 space-y-4 shadow-sm border-primary/5">
      <h3 className="font-bold text-lg">Leave a Review</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="focus:outline-none transition-transform active:scale-90"
            >
              <Star
                className={`w-8 h-8 ${
                  (hover || rating) >= star
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-muted fill-muted'
                }`}
              />
            </button>
          ))}
          <span className="ml-2 text-sm font-medium text-muted-foreground">
            {rating > 0 ? `${rating} stars` : 'Select rating'}
          </span>
        </div>

        <Textarea
          placeholder="How was your experience with this professional?"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[100px] rounded-2xl resize-none focus-visible:ring-primary"
        />

        <Button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className="w-full rounded-xl h-11 bg-primary hover:bg-accent font-bold"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </form>
    </Card>
  )
}
