import { getProviderAvailability, getBlockedDates } from "@/actions/availability-actions"
import { AvailabilityEditor } from "@/components/provider/availability-editor"
import { BlockedDatesEditor } from "@/components/provider/blocked-dates-editor"
import { Calendar, Clock, Info, CalendarOff } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function AvailabilityPage() {
  const availability = await getProviderAvailability()
  const blockedDates = await getBlockedDates()

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4 md:p-0">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <Calendar className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gerenciar Disponibilidade</h1>
            <p className="text-muted-foreground">Controle seus horários recorrentes e datas de ausência.</p>
          </div>
        </div>
      </header>

      <Tabs defaultValue="recurring" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-2xl h-14 w-full md:w-auto grid grid-cols-2">
          <TabsTrigger value="recurring" className="rounded-xl px-8 data-[state=active]:bg-card data-[state=active]:shadow-sm gap-2">
            <Clock className="w-4 h-4" />
            Horários Recorrentes
          </TabsTrigger>
          <TabsTrigger value="blocked" className="rounded-xl px-8 data-[state=active]:bg-card data-[state=active]:shadow-sm gap-2">
            <CalendarOff className="w-4 h-4" />
            Datas Bloqueadas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recurring" className="animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <AvailabilityEditor initialAvailability={availability} />
            </div>
            
            <aside className="space-y-6">
              <Card className="p-6 rounded-3xl bg-primary/5 border-primary/10">
                <h3 className="font-bold flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-primary" /> Dicas da Agenda
                </h3>
                <ul className="space-y-4 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    Defina horários precisos para evitar conflitos.
                  </li>
                  <li className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    Use o botão "Copiar para dias úteis" para economizar tempo.
                  </li>
                  <li className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    Horários inativos não aparecerão para os clientes.
                  </li>
                </ul>
              </Card>

              <div className="p-6 rounded-3xl border-2 border-dashed flex flex-col gap-4 text-center">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <Info className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-bold">Dúvidas?</p>
                  <p className="text-xs text-muted-foreground mt-1">Seus horários são usados para calcular sua disponibilidade em tempo real durante a busca.</p>
                </div>
              </div>
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="blocked" className="animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none">
          <BlockedDatesEditor initialBlockedDates={blockedDates} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
