import Link from 'next/link';
import { LandingHeader } from "@/components/layout/landing-header";
import { Search, MapPin, Star, ShieldCheck, Zap, Briefcase, Wrench, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";

const CATEGORIES = [
  { name: "Limpeza", icon: <Sparkles className="w-4 h-4" /> },
  { name: "Encanamento", icon: <Wrench className="w-4 h-4" /> },
  { name: "Eletricista", icon: <Zap className="w-4 h-4" /> },
  { name: "Consultoria", icon: <Briefcase className="w-4 h-4" /> },
];

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: featuredProviders } = await supabase
    .from('provider_profiles')
    .select(`
      id,
      profession_title,
      rating,
      reviews_count,
      is_verified,
      profiles (
        full_name,
        avatar_url
      )
    `)
    .limit(3)
    .order('rating', { ascending: false });

  return (
    <main className="flex min-h-screen flex-col items-center">
      <LandingHeader user={user} />

      {/* Hero Section */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-primary/90 to-accent text-white px-6 pt-32 pb-20 lg:pt-48 lg:pb-32 flex flex-col items-center text-center">
        {/* Abstract background shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-white/10 blur-[120px]" />
          <div className="absolute bottom-[10%] -right-[10%] w-[40%] h-[60%] rounded-full bg-accent/30 blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-3xl space-y-6">
          <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md px-4 py-1.5 text-sm rounded-full animate-in fade-in slide-in-from-top-4 duration-500">
            ✨ Seu Marketplace de Serviços Premium
          </Badge>
          <h1 className="text-4xl lg:text-7xl font-extrabold tracking-tight text-balance leading-tight animate-in fade-in slide-in-from-top-6 duration-700">
            Encontre os Melhores Profissionais Para Qualquer Projeto
          </h1>
          <p className="text-lg lg:text-xl text-primary-foreground/80 max-w-xl mx-auto font-medium animate-in fade-in slide-in-from-top-8 duration-1000">
            Conecte-se com especialistas verificados em sua área. Rápido, confiável e seguro.
          </p>

          {/* Search Bar - Glassmorphism */}
          <div className="mt-12 p-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
              <Input 
                placeholder="De qual serviço você precisa?" 
                className="w-full bg-transparent border-none text-white placeholder:text-white/60 pl-11 focus-visible:ring-0 focus-visible:ring-offset-0 text-base h-14"
              />
            </div>
            <div className="hidden sm:block w-[1px] bg-white/20 my-3" />
            <div className="flex-1 relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
              <Input 
                placeholder="Cidade ou CEP" 
                className="w-full bg-transparent border-none text-white placeholder:text-white/60 pl-11 focus-visible:ring-0 focus-visible:ring-offset-0 text-base h-14"
              />
            </div>
            <Button size="lg" className="w-full sm:w-auto h-14 px-10 rounded-2xl bg-white text-primary hover:bg-white/90 font-black shadow-lg transition-transform active:scale-95">
              Buscar
            </Button>
          </div>

          {/* Categories */}
          <div className="pt-10 flex flex-wrap justify-center gap-3">
            {CATEGORIES.map((cat, i) => (
              <button 
                key={cat.name}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md transition-all duration-300 font-bold text-sm hover:scale-105"
              >
                {cat.icon}
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Professionals Section */}
      <section className="w-full max-w-7xl px-6 py-24">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div className="text-center md:text-left">
            <h2 className="text-4xl font-extrabold tracking-tight text-foreground">Profissionais em Destaque</h2>
            <p className="text-muted-foreground mt-3 text-lg">Especialistas altamente avaliados prontos para ajudar.</p>
          </div>
          <Link href="/explore">
            <Button variant="ghost" className="text-primary hover:text-accent font-bold h-12 px-6 rounded-xl border border-primary/10">
              Ver todos os especialistas
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredProviders?.map((provider: any) => (
            <div 
              key={provider.id} 
              className="group relative bg-card rounded-[32px] border shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col"
            >
              <div className="p-8 flex gap-5 items-start">
                <div className="relative">
                  <img 
                    src={provider.profiles.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.profiles.full_name)}&background=0E5D91&color=fff`} 
                    alt={provider.profiles.full_name} 
                    className="w-20 h-20 rounded-2xl object-cover shadow-md group-hover:scale-110 transition-transform duration-500"
                  />
                  {provider.is_verified && (
                    <div className="absolute -bottom-1 -right-1 bg-accent text-white p-1 rounded-lg border-2 border-card">
                      <ShieldCheck className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="font-bold text-xl text-foreground leading-tight">{provider.profiles.full_name}</h3>
                  <p className="text-sm text-primary font-bold mt-1 uppercase tracking-wider">{provider.profession_title || "Profissional"}</p>
                  
                  <div className="flex items-center gap-1.5 mt-3">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.floor(provider.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-muted fill-muted'}`} />
                      ))}
                    </div>
                    <span className="text-sm font-black ml-1">{provider.rating || 0}</span>
                    <span className="text-xs text-muted-foreground font-medium">({provider.reviews_count || 0})</span>
                  </div>
                </div>
              </div>
              <div className="mt-auto p-6 pt-0">
                <Link href={`/provider/${provider.id}`}>
                  <Button className="w-full h-12 rounded-2xl bg-primary/5 text-primary hover:bg-primary hover:text-white font-bold transition-all duration-300 border border-primary/10">
                    Ver Perfil
                  </Button>
                </Link>
              </div>
            </div>
          ))}
          
          <Link href="/explore" className="group relative bg-gradient-to-br from-primary/5 to-accent/5 rounded-[32px] border border-dashed border-primary/30 flex flex-col items-center justify-center p-8 text-center hover:border-primary/60 transition-all duration-500 cursor-pointer min-h-[220px]">
             <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm">
               <Search className="w-8 h-8" />
             </div>
             <h3 className="font-bold text-xl text-foreground">Explorar mais</h3>
             <p className="text-sm text-muted-foreground mt-2 font-medium">Encontre exatamente quem você precisa em nossa rede.</p>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full bg-primary/5 py-32 border-y border-primary/10">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
          <h2 className="text-4xl lg:text-5xl font-black tracking-tighter">Você é um profissional?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
            Junte-se ao ProService para se conectar com milhares de clientes e expandir seu negócio. Plano PRO por apenas R$ 10/mês.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6 pt-4">
            <Link href="/login?tab=register">
              <Button size="lg" className="rounded-2xl h-16 px-12 text-lg font-black bg-primary hover:bg-accent shadow-xl shadow-primary/20 transition-transform active:scale-95">
                Torne-se um Prestador
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="rounded-2xl h-16 px-12 text-lg font-bold border-primary/20 hover:bg-white">
              Saiba Mais
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-12 px-6 border-t border-muted/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center opacity-50 grayscale">
            <img src="/logo_full.webp" alt="ProService" className="h-6 w-auto" />
            <span className="ml-2 font-bold tracking-tighter text-xs">&copy; 2026</span>
          </div>
          <div className="flex gap-8 text-sm font-bold text-muted-foreground">
            <Link href="#" className="hover:text-primary transition-colors">Privacidade</Link>
            <Link href="#" className="hover:text-primary transition-colors">Termos</Link>
            <Link href="#" className="hover:text-primary transition-colors">Contato</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
