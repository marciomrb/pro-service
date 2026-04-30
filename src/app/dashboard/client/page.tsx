import { createClient } from '@/lib/supabase/server'
import { redirect } from "next/navigation"
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Clock, ChevronRight, MessageSquare, Calendar } from "lucide-react";
import Link from "next/link";

export default async function ClientDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch real data
  const { count: activeRequests } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', user.id)
    .in('status', ['pending', 'confirmed']);

  const { count: unreadMessages } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', user.id)
    .eq('is_read', false);

  const { count: favoritesCount } = await supabase
    .from('favorites')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // Fetch recent messages/conversations
  const { data: recentMessages } = await supabase
    .from('messages')
    .select(`
      *,
      sender:sender_id (
        full_name,
        avatar_url
      )
    `)
    .eq('receiver_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3);

  // Fetch favorites with profile data
  const { data: favorites } = await supabase
    .from('favorites')
    .select(`
      provider_id,
      provider:provider_id (
        id,
        profession_title,
        rating,
        profiles (
          full_name,
          avatar_url
        )
      )
    `)
    .eq('user_id', user.id)
    .limit(4);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bem-vindo de volta!</h1>
        <p className="text-muted-foreground mt-1">Aqui está o que está acontecendo com seus projetos hoje.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <h3 className="font-semibold text-lg">Solicitações Ativas</h3>
          <p className="text-4xl font-extrabold mt-2 text-primary">{activeRequests || 0}</p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold text-lg">Mensagens não Lidas</h3>
          <p className="text-4xl font-extrabold mt-2 text-accent">{unreadMessages || 0}</p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold text-lg">Favoritos Salvos</h3>
          <p className="text-4xl font-extrabold mt-2 text-foreground">{favoritesCount || 0}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Mensagens Recentes</h2>
            <Link href="/dashboard/client/messages">
              <Button variant="ghost" size="sm" className="text-primary">Ver tudo</Button>
            </Link>
          </div>
          <div className="space-y-4">
            {!recentMessages || recentMessages.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground bg-muted/5 rounded-3xl border-dashed border-2">Nenhuma mensagem ainda.</p>
            ) : (
              recentMessages.map((msg: any) => (
                <Link key={msg.id} href={`/dashboard/client/messages/${msg.sender_id}`}>
                  <Card className="p-4 flex gap-4 hover:shadow-md transition-shadow cursor-pointer mb-3">
                    <div className="w-12 h-12 rounded-full bg-muted overflow-hidden flex-shrink-0">
                      <img src={msg.sender?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender?.full_name)}&background=0E5D91&color=fff`} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold truncate">{msg.sender?.full_name}</h4>
                        <span className="text-xs text-muted-foreground">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-0.5">{msg.content}</p>
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Favoritos</h2>
            <Link href="/dashboard/client/favorites">
              <Button variant="ghost" size="sm" className="text-primary">Ver tudo</Button>
            </Link>
          </div>
          <div className="space-y-4">
            {!favorites || favorites.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-xs bg-muted/5 rounded-2xl border-dashed border-2">Seus favoritos aparecerão aqui.</p>
            ) : (
              favorites.map((fav: any) => (
                <Link key={fav.provider_id} href={`/provider/${fav.provider_id}`}>
                  <div className="flex items-center justify-between p-3 rounded-2xl border bg-card hover:border-primary/30 transition-colors cursor-pointer group mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden">
                        <img src={fav.provider.profiles.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fav.provider.profiles.full_name)}&background=0E5D91&color=fff`} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">{fav.provider.profiles.full_name}</h4>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> {fav.provider.rating || 0}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
