import { createClient } from '@/lib/supabase/server'
import PostCard from '@/components/feed/post-card'
import { Card } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'

export default async function FeedPage() {
  const supabase = await createClient()

  // Fetch posts with related data
  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      id,
      content,
      created_at,
      provider_profiles (
        profession_title,
        is_verified,
        subscription_status,
        profiles (
          full_name,
          avatar_url
        )
      ),
      post_images (
        image_url
      )
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-primary" />
              Feed de Serviços
            </h1>
            <p className="text-muted-foreground mt-1">Veja os últimos trabalhos e atualizações dos melhores profissionais.</p>
          </div>
        </div>

        {/* Feed List */}
        <div className="space-y-6">
          {error || !posts || posts.length === 0 ? (
            <Card className="p-12 text-center bg-card border-dashed border-2 flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg text-foreground">Nenhuma postagem ainda</h3>
                <p className="text-sm text-muted-foreground">Seja o primeiro a ver o que está acontecendo na sua região.</p>
              </div>
            </Card>
          ) : (
            posts.map((post: any) => (
              <PostCard key={post.id} post={post} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
