import { createClient } from '@/lib/supabase/server'
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Filter, Star, ShieldCheck } from "lucide-react";
import Link from "next/link"

export default async function ExplorePage() {
  const supabase = await createClient()

  // Fetch real providers
  const { data: providers, error } = await supabase
    .from('provider_profiles')
    .select(`
      *,
      profiles (
        full_name,
        avatar_url
      )
    `)
    .limit(12)

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
              <div key={p.id} className="group bg-card rounded-3xl border hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden">
                <div className="p-5 flex gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-muted overflow-hidden shrink-0">
                    <img src={p.profiles?.avatar_url || `https://i.pravatar.cc/150?u=${p.id}`} alt="Avatar" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-foreground">{p.profiles?.full_name}</h3>
                      {p.is_verified && <ShieldCheck className="w-4 h-4 text-accent" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{p.profession_title}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1 text-sm font-semibold">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> {p.rating || 'N/A'}
                      </div>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{p.reviews_count || 0} avaliações</span>
                    </div>
                  </div>
                </div>
                <div className="mt-auto border-t bg-muted/20 p-4">
                  <Link href={`/provider/${p.id}`}>
                    <Button className="w-full rounded-xl bg-primary hover:bg-accent transition-colors text-white shadow">
                      Ver Perfil
                    </Button>
                  </Link>
                </div>
              </div>
            ))}

            {displayProviders.length === 0 && [1, 2, 3].map(i => (
               <div key={i} className="group bg-card rounded-3xl border opacity-50 flex flex-col overflow-hidden animate-pulse">
                <div className="p-5 flex gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-muted shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
