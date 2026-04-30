'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, ShieldCheck, Zap, CreditCard } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from "next/navigation"

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleSubscribe = async () => {
    setLoading(true)
    
    // Simula um redirecionamento de gateway de pagamento ou pagamento bem-sucedido
    // Em um app real, você usaria Stripe/MercadoPago aqui
    setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { error } = await supabase
          .from('provider_profiles')
          .update({
            subscription_status: 'active',
            subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq('id', user.id)

        if (!error) {
          router.push('/dashboard/provider?success=subscribed')
        }
      }
      setLoading(false)
    }, 1500)
  }

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-8 px-4">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight">Plano Pro para Profissionais</h1>
        <p className="text-xl text-muted-foreground">Consiga mais leads, compartilhe seu trabalho e expanda seu negócio por apenas R$ 10/mês.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-center pt-8">
        {/* Card de Benefícios */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Por que ser Pro?</h2>
          <ul className="space-y-4">
            {[
              "Postagens ilimitadas no feed social para mostrar seu trabalho",
              "Selo de verificado no seu perfil",
              "Listagem prioritária nos resultados de busca",
              "Chat direto em tempo real com potenciais clientes",
              "Análise detalhada das visualizações do seu perfil",
            ].map((benefit, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="mt-1 bg-green-500/10 rounded-full p-1">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-foreground/80 font-medium">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Card de Preço */}
        <Card className="p-8 rounded-3xl border-primary shadow-2xl relative overflow-hidden bg-card">
          <div className="absolute top-0 right-0 bg-primary text-white px-4 py-1 rounded-bl-xl text-xs font-bold flex items-center gap-1">
            <Zap className="w-3 h-3 fill-white" /> POPULAR
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold">Assinatura Pro</h3>
              <p className="text-muted-foreground">Perfeito para profissionais individuais</p>
            </div>
            
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-extrabold tracking-tight text-primary">R$ 10</span>
              <span className="text-muted-foreground font-medium">/mês</span>
            </div>

            <div className="space-y-4 pt-4">
              <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-700 dark:text-yellow-400 text-sm font-medium flex items-start gap-3">
                <CreditCard className="w-5 h-5 shrink-0 mt-0.5" />
                <span>Integração de pagamento em implementação. Em breve você poderá assinar com segurança via cartão ou Pix.</span>
              </div>
              <Button 
                disabled
                className="w-full h-14 rounded-2xl text-lg font-bold bg-primary/50 cursor-not-allowed opacity-60 shadow-none"
              >
                Em breve — Pagamento seguro
              </Button>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <CreditCard className="w-4 h-4" />
                Pagamento seguro via Stripe / MercadoPago
              </div>
            </div>

            <div className="pt-4 border-t border-muted">
              <div className="flex items-center gap-2 text-sm text-foreground/70">
                <ShieldCheck className="w-5 h-5 text-accent" />
                <span>Cancele a qualquer momento. Sem taxas ocultas.</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
