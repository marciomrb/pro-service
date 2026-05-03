'use client'

import { useState } from 'react'
import { Star, Image as ImageIcon, X, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { submitReview } from '@/app/provider/reviews-actions'
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface CategoryRatingProps {
  label: string
  value: number
  onChange: (value: number) => void
}

function CategoryRating({ label, value, onChange }: CategoryRatingProps) {
  const [hover, setHover] = useState(0)

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="focus:outline-none transition-transform active:scale-90"
          >
            <Star
              className={`w-5 h-5 ${
                (hover || value) >= star
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground/30 fill-muted-foreground/10'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ReviewForm({ providerId }: { providerId: string }) {
  const [punctuality, setPunctuality] = useState(0)
  const [quality, setQuality] = useState(0)
  const [price, setPrice] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [images, setImages] = useState<File[]>([])
  
  const supabase = createClient()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      if (images.length + newFiles.length > 5) {
        toast.error('You can only upload up to 5 images')
        return
      }
      setImages((prev) => [...prev, ...newFiles])
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (punctuality === 0 || quality === 0 || price === 0) {
      toast.error('Please rate all categories')
      return
    }

    setIsSubmitting(true)
    
    try {
      const imageUrls: string[] = []

      // Upload images first
      for (const file of images) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${providerId}/${Date.now()}-${Math.random()}.${fileExt}`
        
        const { error: uploadError, data } = await supabase.storage
          .from('review-images')
          .upload(fileName, file)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          continue
        }

        const { data: { publicUrl } } = supabase.storage
          .from('review-images')
          .getPublicUrl(fileName)
        
        imageUrls.push(publicUrl)
      }

      await submitReview({ 
        providerId, 
        comment,
        rating_punctuality: punctuality,
        rating_quality: quality,
        rating_price: price,
        images: imageUrls
      })
      
      setSubmitted(true)
      toast.success('Review submitted successfully!')
    } catch (error) {
      console.error(error)
      toast.error('Failed to submit review')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <Card className="p-8 bg-primary/5 border-primary/20 text-center space-y-4 rounded-3xl animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Star className="w-8 h-8 fill-primary text-primary" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-xl text-primary">Obrigado pela sua avaliação!</h3>
          <p className="text-muted-foreground">Seu feedback ajuda a comunidade a encontrar os melhores profissionais.</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 space-y-6 shadow-xl border-primary/5 rounded-3xl bg-card">
      <div className="space-y-1">
        <h3 className="font-bold text-xl">Deixe uma Avaliação</h3>
        <p className="text-sm text-muted-foreground">Sua opinião é fundamental para manter a qualidade da plataforma.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1 bg-muted/30 p-4 rounded-2xl border border-muted/50">
          <CategoryRating label="Pontualidade" value={punctuality} onChange={setPunctuality} />
          <CategoryRating label="Qualidade" value={quality} onChange={setQuality} />
          <CategoryRating label="Preço" value={price} onChange={setPrice} />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">Comentário (opcional)</span>
          </div>
          <Textarea
            placeholder="Conte-nos como foi sua experiência com este profissional..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[120px] rounded-2xl resize-none focus-visible:ring-primary border-muted bg-muted/20"
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">Fotos do serviço</span>
            <span className="text-xs text-muted-foreground">{images.length}/5 fotos</span>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {images.map((file, i) => (
              <div key={i} className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-primary/10 shadow-sm group">
                <img
                  src={URL.createObjectURL(file)}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            
            {images.length < 5 && (
              <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group">
                <Camera className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-[10px] font-bold text-muted-foreground group-hover:text-primary uppercase tracking-wider">Adicionar</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            )}
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || punctuality === 0 || quality === 0 || price === 0}
          className="w-full rounded-2xl h-14 bg-primary hover:bg-accent font-bold text-lg shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          {isSubmitting ? 'Enviando...' : 'Publicar Avaliação'}
        </Button>
      </form>
    </Card>
  )
}
