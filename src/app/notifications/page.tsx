import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Bell, BellOff, CheckCheck } from 'lucide-react'
import { markAllNotificationsAsRead, markNotificationAsRead as _markNotificationAsRead } from '@/actions/notification-actions'

async function doMarkRead(notifId: string): Promise<void> {
  'use server'
  await _markNotificationAsRead(notifId)
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notificações</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0
              ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}`
              : 'Tudo em dia!'}
          </p>
        </div>

        {unreadCount > 0 && (
          <form action={markAllNotificationsAsRead}>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Marcar todas como lidas
            </button>
          </form>
        )}
      </div>

      <div className="space-y-3">
        {!notifications || notifications.length === 0 ? (
          <Card className="p-12 flex flex-col items-center justify-center text-center gap-4 bg-muted/10 border-dashed border-2">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <BellOff className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">Nenhuma notificação</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Quando você receber atualizações de agendamentos ou mensagens, elas aparecerão aqui.
              </p>
            </div>
          </Card>
        ) : (
          notifications.map((notif) => (
            <form key={notif.id} action={doMarkRead.bind(null, notif.id)}>
              <button
                type="submit"
                className="w-full text-left"
              >
                <Card
                  className={`p-4 rounded-2xl border transition-all hover:shadow-md cursor-pointer flex items-start gap-4 ${
                    !notif.is_read
                      ? 'border-primary/30 bg-primary/5 hover:bg-primary/10'
                      : 'border-border/50 bg-card hover:bg-muted/20'
                  }`}
                >
                  <div
                    className={`mt-1 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      !notif.is_read ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`font-semibold text-sm truncate ${!notif.is_read ? 'text-foreground' : 'text-foreground/80'}`}>
                        {notif.title}
                      </h4>
                      <div className="flex items-center gap-2 shrink-0">
                        {!notif.is_read && (
                          <span className="w-2 h-2 rounded-full bg-primary" />
                        )}
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(notif.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                    {notif.message && (
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                    )}
                  </div>
                </Card>
              </button>
            </form>
          ))
        )}
      </div>
    </div>
  )
}
