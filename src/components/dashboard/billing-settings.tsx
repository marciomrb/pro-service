'use client'

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Download, ExternalLink, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function BillingSettings({ profile }: { profile: any }) {
  const isProvider = profile?.role === 'provider';
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="p-8 rounded-[32px] border-primary/5 shadow-xl shadow-primary/[0.02] bg-card/50 backdrop-blur-xl space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Faturamento & Planos</h2>
            <p className="text-sm text-muted-foreground mt-1">Gerencie seus métodos de pagamento e assinaturas.</p>
          </div>
          {isProvider && (
            <Link href="/dashboard/provider/subscription">
              <Button variant="outline" className="rounded-xl font-bold border-primary/20 text-primary">
                Ver Planos Pro
              </Button>
            </Link>
          )}
        </div>

        {/* Current Plan Section */}
        <div className="p-6 rounded-2xl border border-muted bg-muted/10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Seu Plano Atual</p>
            <h3 className="text-2xl font-extrabold flex items-center gap-2">
              {isProvider && profile?.provider_profiles?.subscription_status === 'active' 
                ? 'ProService PRO' 
                : 'Plano Gratuito'}
            </h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              {isProvider && profile?.provider_profiles?.subscription_status === 'active'
                ? 'Você tem acesso a todos os recursos premium. Sua próxima cobrança será em 30 dias.'
                : 'Você está no plano básico. Faça upgrade para ter mais visibilidade e recursos exclusivos.'}
            </p>
          </div>
          
          <div className="shrink-0 w-full md:w-auto">
            {isProvider && profile?.provider_profiles?.subscription_status !== 'active' ? (
               <Link href="/dashboard/provider/subscription" className="w-full">
                 <Button className="w-full md:w-auto rounded-xl font-bold bg-primary hover:bg-accent h-12 px-8">
                   Fazer Upgrade
                 </Button>
               </Link>
            ) : (
               <Button variant="secondary" className="w-full md:w-auto rounded-xl font-bold h-12 px-8">
                 Gerenciar Assinatura <ExternalLink className="w-4 h-4 ml-2" />
               </Button>
            )}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-4 pt-4 border-t border-muted">
           <h3 className="font-bold">Métodos de Pagamento</h3>
           <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-muted">
             <div className="flex items-center gap-4">
               <div className="w-12 h-8 bg-white rounded border flex items-center justify-center shrink-0">
                 {/* Placeholder for Visa/Mastercard logo */}
                 <span className="text-[10px] font-black text-blue-900 italic">VISA</span>
               </div>
               <div>
                 <p className="font-bold text-sm">•••• •••• •••• 4242</p>
                 <p className="text-xs text-muted-foreground">Expira em 12/28</p>
               </div>
             </div>
             <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg">
               Remover
             </Button>
           </div>
           <Button variant="outline" className="w-full rounded-2xl border-dashed h-14 text-muted-foreground font-bold hover:text-primary hover:border-primary/50">
             + Adicionar Novo Método de Pagamento
           </Button>
        </div>

        {/* Billing History */}
        <div className="space-y-4 pt-4 border-t border-muted">
           <h3 className="font-bold">Histórico de Faturamento</h3>
           <div className="text-center p-8 bg-muted/10 rounded-2xl border border-dashed">
              <CreditCard className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium">Nenhum histórico de pagamento recente.</p>
           </div>
        </div>
      </Card>
    </div>
  );
}
