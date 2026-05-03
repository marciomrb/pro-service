import { getPendingVerifications } from "@/actions/admin-verification-actions"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BadgeCheck, Clock, ChevronRight, User } from "lucide-react"

export default async function AdminVerificationListPage() {
  const pendingProviders = await getPendingVerifications()

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Verificações Pendentes</h1>
        <p className="text-muted-foreground mt-1">
          Prestadores que enviaram documentos para análise.
        </p>
      </div>

      <div className="grid gap-4">
        {pendingProviders.length === 0 ? (
          <Card className="p-12 flex flex-col items-center justify-center text-center gap-4 rounded-3xl border-dashed">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <BadgeCheck className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Tudo em dia!</h3>
              <p className="text-muted-foreground">Não há solicitações de verificação pendentes no momento.</p>
            </div>
          </Card>
        ) : (
          pendingProviders.map((item: any) => (
            <Card key={item.provider_id} className="p-6 rounded-3xl border-border/50 hover:border-primary/50 transition-colors shadow-sm overflow-hidden relative group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{item.profiles.full_name}</h3>
                    <p className="text-sm text-muted-foreground">{item.profiles.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-xs font-medium border border-amber-500/20">
                    <Clock className="w-3 h-3" />
                    Documentos Pendentes
                  </div>
                  <Button asChild variant="outline" className="rounded-full gap-2 group">
                    <Link href={`/dashboard/admin/verification/${item.provider_id}`}>
                      Analisar
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
