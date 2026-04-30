import { createClient } from '@/lib/supabase/server'
import ChatWindow from '@/components/chat/chat-window'
import { redirect } from "next/navigation"

export default async function MessagePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="max-w-4xl mx-auto py-6 h-[calc(100vh-160px)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Mensagens</h1>
        <p className="text-muted-foreground">Conversa direta com seu prestador.</p>
      </div>
      <ChatWindow chatId={id} userId={user.id} />
    </div>
  )
}
