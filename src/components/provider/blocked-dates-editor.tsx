'use client'

import { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { toggleBlockedDateAction } from '@/actions/availability-actions'
import { 
  CalendarOff, 
  Info,
  Loader2,
  Calendar as CalendarIcon,
  X
} from 'lucide-react'
import { ptBR } from 'date-fns/locale'
import { format, isSameDay, parseISO } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'

interface BlockedDatesEditorProps {
  initialBlockedDates: any[]
}

export function BlockedDatesEditor({ initialBlockedDates }: BlockedDatesEditorProps) {
  const [blockedDates, setBlockedDates] = useState<Date[]>(
    initialBlockedDates.map(d => parseISO(d.blocked_date))
  )
  const [loading, setLoading] = useState<string | null>(null)

  const handleDateSelect = async (date: Date | undefined) => {
    if (!date) return

    const dateStr = format(date, 'yyyy-MM-dd')
    setLoading(dateStr)

    try {
      const result = await toggleBlockedDateAction(dateStr)
      if (result.error) {
        toast.error(result.error)
      } else {
        const isBlocked = blockedDates.some(d => isSameDay(d, date))
        if (isBlocked) {
          setBlockedDates(blockedDates.filter(d => !isSameDay(d, date)))
          toast.success(`Data ${format(date, 'dd/MM')} desbloqueada`)
        } else {
          setBlockedDates([...blockedDates, date])
          toast.success(`Data ${format(date, 'dd/MM')} bloqueada`)
        }
      }
    } catch (error) {
      toast.error("Erro ao atualizar data")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6 rounded-3xl border-border/50 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-destructive/10 rounded-xl">
              <CalendarOff className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Bloquear Datas</h3>
              <p className="text-sm text-muted-foreground">Selecione dias específicos em que você não estará disponível.</p>
            </div>
          </div>

          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={undefined}
              onSelect={handleDateSelect}
              locale={ptBR}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              modifiers={{
                blocked: blockedDates
              }}
              classNames={{
                blocked: "bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
              }}
              className="rounded-2xl border-none"
            />
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6 rounded-3xl border-border/50 shadow-sm">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" /> Datas Bloqueadas
            </h3>
            
            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {blockedDates.length > 0 ? (
                  blockedDates
                    .sort((a, b) => a.getTime() - b.getTime())
                    .map((date) => (
                      <motion.div
                        key={date.toISOString()}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border/50 group"
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">
                            {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                          </span>
                          <span className="text-xs text-muted-foreground">O dia todo</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDateSelect(date)}
                          disabled={!!loading}
                        >
                          {loading === format(date, 'yyyy-MM-dd') ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-4 h-4 text-destructive" />
                          )}
                        </Button>
                      </motion.div>
                    ))
                ) : (
                  <div className="text-center py-12 border-2 border-dashed rounded-3xl text-muted-foreground flex flex-col items-center gap-3">
                    <CalendarIcon className="w-8 h-8 opacity-20" />
                    <p className="text-sm">Nenhuma data bloqueada selecionada.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </Card>

          <Card className="p-6 rounded-3xl bg-blue-500/5 border-blue-500/10">
            <div className="flex gap-4">
              <div className="p-2 bg-blue-500/10 rounded-xl h-fit">
                <Info className="w-5 h-5 text-blue-500" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-blue-700">Por que bloquear datas?</p>
                <p className="text-xs text-blue-600/80 leading-relaxed">
                  Bloquear datas garante que os clientes não consigam agendar serviços em dias que você está de folga, viajando ou em feriados. Isso evita cancelamentos e mantém sua reputação alta.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
