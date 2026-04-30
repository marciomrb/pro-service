import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import Link from "next/link"
import { redirect } from "next/navigation"
import { MessageSquare, User } from 'lucide-react'

export default async function MessagesListPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch chats where the user is the client
  const { data: chats, error } = await supabase
    .from('chats')
    .select(`
      id,
      last_message,
      updated_at,
      provider_profiles (
        profiles (
          full_name,
          avatar_url
        )
      )
    `)
    .eq('client_id', user.id)
    .order('updated_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Mensagens</h1>
        <p className="text-muted-foreground mt-1">Gerencie suas conversas com os prestadores de serviço.</p>
      </div>

      <div className="space-y-4">
        {error || !chats || chats.length === 0 ? (
          <Card className="p-12 text-center flex flex-col items-center justify-center space-y-4 bg-muted/20 border-dashed border-2">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">Nenhuma conversa ainda</h3>
              <p className="text-sm text-muted-foreground max-w-xs">Quando você entrar em contato com um profissional, sua conversa aparecerá aqui.</p>
            </div>
            <Link href="/explore">
              <Card className="px-6 py-2 hover:bg-primary hover:text-white transition-colors cursor-pointer text-sm font-semibold">
                Explorar Profissionais
              </Card>
            </Link>
          </Card>
        ) : (
          chats.map((chat: any) => (
            <Link key={chat.id} href={`/dashboard/client/messages/${chat.id}`}>
              <Card className="p-4 flex items-center gap-4 hover:shadow-md transition-all border-primary/5 hover:border-primary/20 group cursor-pointer">
                <div className="w-14 h-14 rounded-full bg-muted overflow-hidden flex-shrink-0 border-2 border-background shadow-sm">
                  {chat.provider_profiles?.profiles?.avatar_url ? (
                    <img src={chat.provider_profiles.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                      <User className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-foreground group-hover:text-primary transition-colors truncate">
                      {chat.provider_profiles?.profiles?.full_name || 'Prestador de Serviço'}
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      {new Date(chat.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-1">
                    {chat.last_message || 'Inicie uma conversa...'}
                  </p>
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
