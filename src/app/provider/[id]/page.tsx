import { createClient } from '@/lib/supabase/server'
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Star, ShieldCheck, Mail, Calendar, Grid3X3, Image as ImageIcon, MessageSquare, Zap } from "lucide-react";
import { notFound } from 'next/navigation'
import { getOrCreateChat, trackProfileView } from '../actions'
import ReviewForm from '@/components/provider/review-form'
import PostCard from '@/components/feed/post-card'
import BookingForm from '@/components/provider/booking-form'

export default async function ProviderProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params
  
  // Track profile view
  await trackProfileView(id)

  const { tab = 'portfolio' } = await searchParams
  const supabase = await createClient()

  // Fetch provider data
  const { data: provider, error: pError } = await supabase
    .from('provider_profiles')
    .select(`
      *,
      profiles (
        full_name,
        avatar_url,
        created_at
      )
    `)
    .eq('id', id)
    .single()

  // Fetch reviews
  const { data: reviews, error: rError } = await supabase
    .from('reviews')
    .select(`
      *,
      client_profiles (
        profiles (
          full_name,
          avatar_url
        )
      ),
      review_images (
        image_url
      )
    `)
    .eq('provider_id', id)
    .order('created_at', { ascending: false })

  // Fetch posts
  const { data: posts } = await supabase
    .from('posts')
    .select(`
      *,
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
    .eq('provider_id', id)
    .order('created_at', { ascending: false })

  if (pError || !provider) {
    console.error('Provider not found:', pError)
  }

  const pData = provider || {
    profession_title: "Eletricista Master",
    city: "São Paulo, SP",
    rating: 4.9,
    reviews_count: 124,
    bio: "Eletricista profissional com mais de 10 anos de experiência. Totalmente licenciado e segurado. Especializado em automação residencial, atualizações de painéis e reparos de emergência.",
    hourly_rate: 85,
    is_verified: true,
    profiles: {
      full_name: "Alex Silva",
      avatar_url: "https://i.pravatar.cc/300?u=a042581f4e29026704d",
      created_at: new Date().toISOString()
    }
  }

  const startChat = getOrCreateChat.bind(null, id)

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      {/* Cover and Header */}
      <div className="h-64 bg-gradient-to-r from-primary to-accent relative" />
      
      <div className="max-w-5xl mx-auto px-6 -mt-24 relative z-10">
        <Card className="p-6 sm:p-8 rounded-3xl shadow-lg border-primary/10 flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl border-4 border-card overflow-hidden shrink-0 shadow-md">
            <img src={pData.profiles?.avatar_url || ""} alt={pData.profiles?.full_name} className="w-full h-full object-cover" />
          </div>
          
          <div className="flex-1 space-y-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-extrabold tracking-tight">{pData.profiles?.full_name}</h1>
                {pData.is_verified && <ShieldCheck className="w-6 h-6 text-accent" />}
                {pData.subscription_status === 'active' && (
                  <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px] font-bold border border-primary/20">
                    <Zap className="w-3 h-3 fill-primary" /> PRO
                  </div>
                )}
              </div>
              <p className="text-lg text-primary font-semibold leading-none">{pData.profession_title}</p>
            </div>
            
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground font-medium">
              <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {pData.city}</div>
              <div className="flex items-center gap-1.5 text-foreground">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> {pData.rating || 'N/A'} ({pData.reviews_count || 0} avaliações)
              </div>
              <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Membro desde {new Date(pData.profiles?.created_at || "").getFullYear()}</div>
            </div>
            
            <p className="text-foreground/80 leading-relaxed max-w-2xl italic">
              "{pData.bio}"
            </p>
          </div>
          
          <div className="w-full md:w-auto flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <form action={startChat}>
              <Button size="lg" type="submit" className="w-full rounded-xl px-8 shadow-md text-base font-bold bg-primary hover:bg-accent transition-colors">
                Contratar
              </Button>
            </form>
            <form action={startChat}>
              <Button size="lg" type="submit" variant="outline" className="w-full rounded-xl px-8 text-base">
                <Mail className="w-4 h-4 mr-2" /> Mensagem
              </Button>
            </form>
          </div>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left column: Feed/Portfolio/Reviews */}
        <div className="md:col-span-2 space-y-8">
          <div className="flex items-center gap-8 border-b pb-4 overflow-x-auto">
            <a href={`?tab=portfolio`} className={`text-lg font-bold pb-4 -mb-[18px] flex items-center gap-2 whitespace-nowrap transition-colors ${tab === 'portfolio' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              <Grid3X3 className="w-5 h-5" /> Portfólio
            </a>
            <a href={`?tab=reviews`} className={`text-lg font-bold pb-4 -mb-[18px] flex items-center gap-2 whitespace-nowrap transition-colors ${tab === 'reviews' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              <Star className="w-5 h-5" /> Avaliações ({reviews?.length || 0})
            </a>
          </div>

          <div className="space-y-6">
            {tab === 'portfolio' ? (
              <div className="space-y-6">
                {posts && posts.length > 0 ? (
                  posts.map((post: any) => (
                    <PostCard key={post.id} post={post} />
                  ))
                ) : (
                  <Card className="p-12 text-center text-muted-foreground border-dashed border-2">
                    <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>Nenhuma atualização de portfólio compartilhada ainda.</p>
                  </Card>
                )}
              </div>
            ) : (
              <div className="space-y-8">
                <ReviewForm providerId={id} />
                
                <div className="space-y-6">
                  {reviews && reviews.length > 0 ? (
                    reviews.map((review: any) => (
                      <Card key={review.id} className="p-6 rounded-3xl border-muted/50 bg-card">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-muted border-2 border-primary/10">
                              <img 
                                src={review.client_profiles?.profiles?.avatar_url || `https://i.pravatar.cc/150?u=${review.id}`} 
                                alt="Cliente" 
                                className="w-full h-full object-cover" 
                              />
                            </div>
                            <div>
                              <h4 className="font-bold text-base">{review.client_profiles?.profiles?.full_name || 'Anônimo'}</h4>
                              <div className="flex items-center gap-1.5">
                                <div className="flex items-center gap-0.5">
                                  {Array.from({ length: 5 }).map((_, idx) => (
                                    <Star key={idx} className={`w-3.5 h-3.5 ${idx < Math.floor(review.rating) ? 'fill-yellow-400 text-yellow-400' : 'fill-muted text-muted'}`} />
                                  ))}
                                </div>
                                <span className="text-xs font-bold text-muted-foreground">{Number(review.rating).toFixed(1)}</span>
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground font-medium">{new Date(review.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>

                        {/* Sub-ratings breakdown */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4 pb-4 border-b border-muted/30">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Pontualidade:</span>
                            <div className="flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, idx) => (
                                <div key={idx} className={`w-1.5 h-1.5 rounded-full ${idx < review.rating_punctuality ? 'bg-yellow-400' : 'bg-muted'}`} />
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Qualidade:</span>
                            <div className="flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, idx) => (
                                <div key={idx} className={`w-1.5 h-1.5 rounded-full ${idx < review.rating_quality ? 'bg-yellow-400' : 'bg-muted'}`} />
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Preço:</span>
                            <div className="flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, idx) => (
                                <div key={idx} className={`w-1.5 h-1.5 rounded-full ${idx < review.rating_price ? 'bg-yellow-400' : 'bg-muted'}`} />
                              ))}
                            </div>
                          </div>
                        </div>

                        <p className="text-sm text-foreground/80 leading-relaxed mb-4">
                          {review.comment}
                        </p>

                        {/* Review Images */}
                        {review.review_images && review.review_images.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            {review.review_images.map((img: any, i: number) => (
                              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-primary/5 cursor-pointer hover:opacity-90 transition-opacity">
                                <img 
                                  src={img.image_url} 
                                  alt={`Review image ${i+1}`} 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p>Nenhuma avaliação ainda. Seja o primeiro a deixar uma!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Booking & Details */}
        <div className="space-y-6">
          <BookingForm providerId={id} providerName={pData.profiles?.full_name || 'Profissional'} />
          
          <Card className="p-6 rounded-3xl border-muted/50 bg-card">
            <h3 className="font-bold text-lg mb-4">Detalhes do Serviço</h3>
            <ul className="space-y-4">
              <li className="flex justify-between items-center pb-4 border-b">
                <span className="text-muted-foreground font-medium">Taxa Horária</span>
                <span className="font-bold text-lg text-primary">R${pData.hourly_rate}/h</span>
              </li>
              <li className="flex justify-between items-center pb-4 border-b">
                <span className="text-muted-foreground font-medium">Tempo de Resposta</span>
                <span className="font-bold">~ 1 hora</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">Serviços Concluídos</span>
                <span className="font-bold">{pData.reviews_count ? pData.reviews_count * 2 : 0}+</span>
              </li>
            </ul>
          </Card>
        </div>

      </div>
    </div>
  );
}
