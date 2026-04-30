'use client'

import { Card } from '@/components/ui/card'
import { Star, MessageSquare, Heart, Share2, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PostProps {
  post: {
    id: string
    content: string | null
    created_at: string | null
    provider_profiles: {
      profession_title: string
      profiles: {
        full_name: string
        avatar_url: string | null
      }
    }
    post_images: { image_url: string }[]
  }
}

export default function PostCard({ post }: PostProps) {
  return (
    <Card className="rounded-3xl shadow-sm border-primary/5 bg-card overflow-hidden">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted overflow-hidden border">
              <img
                src={post.provider_profiles.profiles.avatar_url || `https://i.pravatar.cc/150?u=${post.id}`}
                alt={post.provider_profiles.profiles.full_name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h4 className="font-bold text-sm leading-none">{post.provider_profiles.profiles.full_name}</h4>
              <p className="text-[10px] text-muted-foreground mt-1">{post.provider_profiles.profession_title}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        {post.content && (
          <p className="text-sm text-foreground/90 leading-relaxed mb-4">
            {post.content}
          </p>
        )}

        {/* Images */}
        {post.post_images && post.post_images.length > 0 && (
          <div className={`grid gap-2 rounded-2xl overflow-hidden mb-4 ${
            post.post_images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
          }`}>
            {post.post_images.map((img, i) => (
              <div key={i} className="aspect-video bg-muted relative">
                <img
                  src={img.image_url}
                  alt="Post content"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-muted/50">
          <div className="flex gap-1 sm:gap-4">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary gap-1.5 px-2">
              <Heart className="w-4 h-4" />
              <span className="text-[10px] font-medium">Like</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary gap-1.5 px-2">
              <MessageSquare className="w-4 h-4" />
              <span className="text-[10px] font-medium">Comment</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary gap-1.5 px-2">
              <Share2 className="w-4 h-4" />
              <span className="text-[10px] font-medium">Share</span>
            </Button>
          </div>
          <div className="text-[10px] text-muted-foreground">
            {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Just now'}
          </div>
        </div>
      </div>
    </Card>
  )
}
