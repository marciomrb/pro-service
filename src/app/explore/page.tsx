import { createClient } from '@/lib/supabase/server'
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Filter, Star, ShieldCheck, Zap, ArrowRight } from "lucide-react";
import Link from "next/link"

export default async function ExplorePage() {
  const supabase = await createClient()

  // Fetch real providers ordered by subscription status
  const { data: providers, error } = await supabase
    .from('provider_profiles')
    .select(`
      *,
      profiles (
        full_name,
        avatar_url
      )
    `)
    .order('is_verified', { ascending: false })
    .order('subscription_status', { ascending: true })
    .limit(20)

  const displayProviders = providers && providers.length > 0 ? providers : []

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      {/* Header / Search Area */}
      <header className="bg-primary px-6 py-12 lg:py-16 text-white sticky top-0 z-20">
        <div className="max-w-6xl mx-auto space-y-6">
          <h1 className="text-3xl lg:text-4xl font-bold">Explorar Profissionais</h1>
          
          <div className="bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 flex flex-col md:flex-row gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
              <Input 
                placeholder="Qual serviço você precisa?" 
                className="w-full bg-transparent border-none text-white placeholder:text-white/60 pl-10 focus-visible:ring-0 h-12"
              />
            </div>
            <div className="hidden md:block w-[1px] bg-white/20 my-2" />
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
              <Input 
                placeholder="Localização" 
                className="w-full bg-transparent border-none text-white placeholder:text-white/60 pl-10 focus-visible:ring-0 h-12"
              />
            </div>
            <Button size="lg" className="h-12 px-8 rounded-xl bg-white text-primary hover:bg-white/90 font-bold">
              Buscar
            </Button>
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {["Todos", "Encanadores", "Eletricistas", "Faxineiros", "Pedreiros", "Designers"].map(tag => (
              <Badge key={tag} variant="secondary" className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border-white/20 text-white font-medium cursor-pointer whitespace-nowrap">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </header>

      {/* Main Layout: Filters + Results */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-6 flex gap-8">
        {/* Filters Sidebar (Desktop) */}
        <aside className="w-64 hidden lg:block space-y-6 shrink-0">
          <div className="flex items-center gap-2 font-semibold text-lg pb-4 border-b">
            <Filter className="w-5 h-5" /> Filtros
          </div>
          
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Avaliação</h3>
            <div className="space-y-2">
              {[4, 3, 2].map(rating => (
                <label key={rating} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-input text-primary focus:ring-primary w-4 h-4" />
                  <div className="flex items-center gap-1 text-sm">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'fill-muted text-muted'}`} />
                    ))}
                    <span className="ml-1">& Acima</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Results Grid */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <p className="text-muted-foreground font-medium">
              {displayProviders.length > 0 ? `Mostrando ${displayProviders.length} resultados` : 'Nenhum profissional encontrado com esses critérios.'}
            </p>
            <Button variant="outline" size="sm" className="lg:hidden flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filtros
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {displayProviders.map((p: any) => (
              <div key={p.id} className="group bg-card rounded-[2rem] border border-border/50 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 flex flex-col overflow-hidden relative">
                {/* PRO Badge Overlay */}
                {p.subscription_status === 'active' && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className="bg-primary/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-lg border border-white/20">
                      <Zap className="w-3 h-3 fill-current" />
                      PRO
                    </div>
                  </div>
                )}

                <div className="p-6 flex flex-col gap-4">
                  <div className="flex gap-4">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl bg-muted overflow-hidden border-2 border-background shadow-sm">
                        <img 
                          src={p.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.profiles?.full_name || p.id}`} 
                          alt="Avatar" 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h3 className="font-bold text-lg text-foreground truncate">{p.profiles?.full_name}</h3>
                        {p.is_verified && (
                          <Badge className="bg-blue-500 text-white text-[9px] h-4 px-1.5 font-black uppercase tracking-tighter">
                            <ShieldCheck className="w-2.5 h-2.5 mr-0.5 fill-current" />
                            Verificado
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {p.city || 'Sua Região'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <div className="flex items-center gap-0.5 text-sm font-bold bg-yellow-400/10 text-yellow-600 px-2 py-0.5 rounded-lg">
                          <Star className="w-3.5 h-3.5 fill-current" /> {p.rating ? Number(p.rating).toFixed(1) : '5.0'}
                        </div>
                        <span className="text-[11px] font-medium text-muted-foreground">({p.reviews_count || 0} avaliações)</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-foreground mb-1">{p.profession_title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {p.bio || 'Especialista em serviços de alta qualidade para sua casa ou empresa.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-4 border-t border-dashed">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">A partir de</span>
                      <span className="text-lg font-black text-primary">R$ {p.hourly_rate || '50'}<span className="text-xs font-normal text-muted-foreground">/h</span></span>
                    </div>
                    <Link href={`/provider/${p.id}`} className="shrink-0">
                      <Button size="sm" className="rounded-xl px-5 bg-foreground hover:bg-primary transition-all duration-300 font-bold group/btn">
                        Ver Perfil
                        <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {displayProviders.length === 0 && [1, 2, 3].map(i => (
               <div key={i} className="bg-card rounded-[2rem] border border-border/50 p-6 flex flex-col gap-4 opacity-50 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-muted" />
                  <div className="flex-1 space-y-3 pt-2">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
