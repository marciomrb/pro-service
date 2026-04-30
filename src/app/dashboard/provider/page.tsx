import { createClient } from '@/lib/supabase/server'
import { redirect } from "next/navigation"
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Users, Star, MessageSquare, TrendingUp, AlertCircle, ShieldCheck, Zap, Calendar } from "lucide-react";
import CreatePost from "@/components/feed/create-post";
import Link from "next/link"
import { Badge } from "@/components/ui/badge";

// Assume updateBookingStatus is available or implement a placeholder
async function updateBookingStatus(id: string, status: string) {
  'use server';
  const supabase = await createClient();
  await supabase
    .from('bookings')
    .update({ status })
    .eq('id', id);
}

export default async function ProviderDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch provider profile including subscription status
  const { data: profile } = await supabase
    .from('provider_profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .single()

  // Fetch bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      *,
      profiles:client_id (
        full_name,
        avatar_url
      )
    `)
    .eq('provider_id', user.id)
    .order('booking_date', { ascending: true })

  const isSubscribed = profile?.subscription_status === 'active'

  // Calculate statistics from real data
  const estimatedEarnings = bookings?.reduce((acc, b) => b.status === 'completed' ? acc + (Number(b.hourly_rate || 0) * 2) : acc, 0) || 0;
  const uniqueClients = new Set(bookings?.map(b => b.client_id)).size;
  const completedJobs = bookings?.filter(b => b.status === 'completed').length || 0;
  
  // Fetch views count (from profile_views table)
  const { data: viewsData } = await supabase
    .from('profile_views')
    .select('id')
    .eq('provider_id', user.id);
  const viewsCount = viewsData?.length || 0;

  // Fetch recent reviews
  const { data: recentReviews } = await supabase
    .from('reviews')
    .select(`
      *,
      profiles (
        full_name,
        avatar_url
      )
    `)
    .eq('provider_id', user.id)
    .limit(3)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel do Profissional</h1>
          <p className="text-muted-foreground mt-1">Gerencie seu negócio e acompanhe seu desempenho.</p>
        </div>
        <div className="flex gap-2">
          {!isSubscribed && (
            <Link href="/dashboard/provider/subscription">
              <Button className="bg-accent hover:bg-accent/90 text-white rounded-xl shadow-md gap-2">
                <Zap className="w-4 h-4 fill-white" /> Upgrade para Pro
              </Button>
            </Link>
          )}
          <Link href="/dashboard/settings">
            <Button variant="outline" className="rounded-xl shadow-sm border-primary/20 text-primary">
              Editar Perfil
            </Button>
          </Link>
        </div>
      </div>

      {/* Subscription Alert Banner */}
      {!isSubscribed && (
        <Card className="p-6 bg-primary/5 border-primary/20 rounded-3xl flex flex-col md:flex-row items-center gap-6 justify-between border-dashed border-2">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <AlertCircle className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Conta Inativa</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Sua assinatura está inativa no momento. Assine o plano Pro por apenas R$ 10/mês para postar atualizações e começar a receber solicitações de clientes.
              </p>
            </div>
          </div>
          <Link href="/dashboard/provider/subscription">
            <Button className="bg-primary hover:bg-accent text-white px-8 h-12 rounded-xl font-bold">
              Assinar Agora
            </Button>
          </Link>
        </Card>
      )}

      {/* Post Creation Area - Only for subscribed users */}
      <div className="max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Postar uma Atualização</h2>
          {!isSubscribed && <span className="text-[10px] bg-muted px-2 py-1 rounded text-muted-foreground uppercase font-bold tracking-wider">Recurso Pro</span>}
        </div>
        <div className={!isSubscribed ? "opacity-50 pointer-events-none grayscale" : ""}>
          <CreatePost providerId={user.id} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 border-l-4 border-l-primary">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Ganhos Est.</p>
              <h3 className="text-2xl font-extrabold mt-1">R$ {estimatedEarnings}</h3>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Clientes Únicos</p>
              <h3 className="text-2xl font-extrabold mt-1">{uniqueClients}</h3>
            </div>
            <div className="p-2 bg-muted rounded-lg">
              <Users className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Visualizações</p>
              <h3 className="text-2xl font-extrabold mt-1">{viewsCount || 0}</h3>
            </div>
            <div className="p-2 bg-muted rounded-lg">
              <BarChart className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Trabalhos Concluídos</p>
              <h3 className="text-2xl font-extrabold mt-1">{completedJobs}</h3>
            </div>
            <div className="p-2 bg-yellow-400/10 rounded-lg">
              <Star className="w-5 h-5 text-yellow-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Bookings Management */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Agendamentos de Serviços</h2>
          <div className="flex gap-2">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-yellow-500" /> Pendente
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-green-500" /> Confirmado
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!bookings || bookings.length === 0 ? (
            <div className="md:col-span-2 text-center py-12 text-muted-foreground bg-muted/10 rounded-3xl border-dashed border-2">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Nenhum agendamento marcado ainda.</p>
            </div>
          ) : (
            bookings.map((booking: any) => (
              <Card key={booking.id} className="p-4 border-muted/50 hover:border-primary/20 transition-colors bg-card/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-muted">
                      <img src={booking.profiles?.avatar_url || `https://i.pravatar.cc/150?u=${booking.id}`} alt="Cliente" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{booking.profiles?.full_name}</h4>
                      <p className="text-xs text-muted-foreground">{new Date(booking.booking_date).toLocaleDateString()} às {new Date(booking.booking_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <Badge variant={booking.status === 'confirmed' ? 'default' : booking.status === 'pending' ? 'secondary' : 'outline'} className="rounded-full px-3 py-0.5 text-[10px]">
                    {booking.status === 'pending' ? 'Pendente' : booking.status === 'confirmed' ? 'Confirmado' : booking.status}
                  </Badge>
                </div>
                <p className="text-sm text-foreground/80 mb-4 line-clamp-2 italic">
                  "{booking.description || 'Nenhuma descrição fornecida.'}"
                </p>
                
                {booking.status === 'pending' && (
                  <div className="flex gap-2">
                    <form action={async () => { 'use server'; await updateBookingStatus(booking.id, 'confirmed') }} className="flex-1">
                      <Button size="sm" type="submit" className="w-full rounded-xl bg-green-600 hover:bg-green-700 text-white h-9 text-xs font-bold">
                        Confirmar
                      </Button>
                    </form>
                    <form action={async () => { 'use server'; await updateBookingStatus(booking.id, 'cancelled') }} className="flex-1">
                      <Button size="sm" type="submit" variant="outline" className="w-full rounded-xl h-9 text-xs font-bold text-destructive hover:bg-destructive/5">
                        Recusar
                      </Button>
                    </form>
                  </div>
                )}
                {booking.status === 'confirmed' && (
                  <form action={async () => { 'use server'; await updateBookingStatus(booking.id, 'completed') }} className="w-full">
                    <Button size="sm" type="submit" variant="secondary" className="w-full rounded-xl h-9 text-xs font-bold text-primary">
                      Marcar como Concluído
                    </Button>
                  </form>
                )}
              </Card>
            ))
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Leads Recentes</h2>
            <Link href="/dashboard/provider/leads">
              <Button variant="ghost" size="sm" className="text-primary">Ver tudo</Button>
            </Link>
          </div>
          <div className="space-y-4">
            {!bookings || bookings.filter(b => b.status === 'pending').length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">Nenhum novo lead ainda.</p>
            ) : (
              bookings.filter(b => b.status === 'pending').slice(0, 3).map((lead: any) => (
                <div key={lead.id} className="flex items-center justify-between p-4 rounded-2xl border bg-muted/20 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-background border">
                      <img src={lead.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(lead.profiles?.full_name)}&background=0E5D91&color=fff`} alt="Cliente" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{lead.profiles?.full_name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Solicitado em {new Date(lead.booking_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Link href={`/dashboard/provider/messages/${lead.client_id}`}>
                    <Button size="icon" variant="secondary" className="rounded-full w-10 h-10 text-primary hover:bg-primary hover:text-white transition-colors">
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Avaliações Recentes</h2>
            <Button variant="ghost" size="sm" className="text-primary">Ver tudo</Button>
          </div>
          <div className="space-y-4">
            {!recentReviews || recentReviews.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">Nenhuma avaliação recebida ainda.</p>
            ) : (
              recentReviews.map((review: any) => (
                <div key={review.id} className="p-4 rounded-2xl border bg-card space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden">
                        <img src={review.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.profiles?.full_name)}&background=0E5D91&color=fff`} alt="Cliente" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{review.profiles?.full_name}</h4>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star key={idx} className={`w-3 h-3 ${idx < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted fill-muted'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground italic">"{review.comment}"</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
