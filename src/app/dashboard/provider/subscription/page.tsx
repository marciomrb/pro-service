"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Check,
  ShieldCheck,
  Zap,
  CreditCard,
  Ticket,
  Loader2,
  AlertCircle,
  MessageSquare,
  Sparkles,
  X,
} from "lucide-react";
import {
  createProviderSubscription,
  requestCoupon,
} from "@/actions/subscription-actions";
import { updateBillingInfo } from "@/actions/profile-actions";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [billingInfo, setBillingInfo] = useState({ cpf_cnpj: "", phone: "" });
  const [hasBillingInfo, setHasBillingInfo] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(
    null,
  );
  const [isRequestingCoupon, setIsRequestingCoupon] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*, provider_profiles(*), subscriptions(*)")
          .eq("id", user.id)
          .single();

        if (profile) {
          const provider = Array.isArray(profile.provider_profiles)
            ? profile.provider_profiles[0]
            : profile.provider_profiles;
          if (provider?.cpf_cnpj) {
            setHasBillingInfo(true);
            setBillingInfo({
              cpf_cnpj: provider.cpf_cnpj,
              phone: provider.phone || "",
            });
          }

          const sub = Array.isArray(profile.subscriptions)
            ? profile.subscriptions[0]
            : profile.subscriptions;
          if (sub) {
            setSubscriptionStatus(sub.status);
          }
        }
      }
      setProfileLoading(false);
    }
    loadData();
  }, []);

  const handleUpdateBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await updateBillingInfo(billingInfo);
    if (result.success) {
      setHasBillingInfo(true);
      toast.success("Dados de faturamento salvos!");
    } else {
      toast.error(result.error || "Erro ao salvar dados");
    }
    setLoading(false);
  };

  const handleSubscribe = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append("couponCode", couponCode);

    const result = await createProviderSubscription(formData);

    if (result.error) {
      toast.error(result.error);
    } else if (result.success) {
      toast.success(result.message);
      setSubscriptionStatus("PENDING");
    }
    setLoading(false);
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 space-y-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <Badge
          variant="outline"
          className="px-4 py-1 border-primary/30 text-primary bg-primary/5 rounded-full uppercase tracking-widest text-[10px] font-bold"
        >
          Seja um Profissional de Elite
        </Badge>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-linear-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
          Plano Pro para Prestadores
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Aumente sua visibilidade, conquiste mais clientes e profissionalize
          seu negócio com ferramentas exclusivas.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Lado Esquerdo: Benefícios */}
        <div className="lg:col-span-7 space-y-8">
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                title: "Selo de Verificado",
                desc: "Destaque-se com o selo azul de confiança.",
                icon: <ShieldCheck className="w-5 h-5 text-blue-500" />,
              },
              {
                title: "Prioridade na Busca",
                desc: "Apareça antes de outros prestadores.",
                icon: <Zap className="w-5 h-5 text-yellow-500" />,
              },
              {
                title: "Feed Social Ilimitado",
                desc: "Poste fotos e vídeos dos seus serviços.",
                icon: <Sparkles className="w-5 h-5 text-purple-500" />,
              },
              {
                title: "Chat em Tempo Real",
                desc: "Negocie diretamente com o cliente.",
                icon: <MessageSquare className="w-5 h-5 text-green-500" />,
              },
            ].map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-colors group"
              >
                <div className="mb-3 p-2 rounded-xl bg-muted w-fit group-hover:bg-primary/10 transition-colors">
                  {benefit.icon}
                </div>
                <h3 className="font-bold text-foreground">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {benefit.desc}
                </p>
              </motion.div>
            ))}
          </div>

          <Card className="p-6 bg-primary/5 border-primary/20 rounded-3xl overflow-hidden relative">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <Zap className="w-32 h-32 text-primary" />
            </div>
            <div className="relative z-10 flex items-center gap-4">
              <div className="p-3 bg-primary rounded-2xl">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-lg">Cancele quando quiser</h4>
                <p className="text-sm text-muted-foreground italic">
                  Não prendemos você com contratos. Sua evolução depende do seu
                  resultado.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Lado Direito: Checkout */}
        <div className="lg:col-span-5 relative">
          <AnimatePresence mode="wait">
            {!hasBillingInfo ? (
              <motion.div
                key="billing-form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="p-8 rounded-[2.5rem] border-primary/20 shadow-2xl bg-card/80 backdrop-blur-xl">
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <h3 className="text-2xl font-bold">
                        Dados de Faturamento
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Precisamos desses dados para gerar sua cobrança no
                        Asaas.
                      </p>
                    </div>

                    <form onSubmit={handleUpdateBilling} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                          CPF ou CNPJ
                        </label>
                        <Input
                          placeholder="000.000.000-00"
                          className="h-12 rounded-xl bg-muted/50 border-border/50 focus:border-primary"
                          value={billingInfo.cpf_cnpj}
                          onChange={(e) =>
                            setBillingInfo({
                              ...billingInfo,
                              cpf_cnpj: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                          Telefone (WhatsApp)
                        </label>
                        <Input
                          placeholder="(11) 99999-9999"
                          className="h-12 rounded-xl bg-muted/50 border-border/50 focus:border-primary"
                          value={billingInfo.phone}
                          onChange={(e) =>
                            setBillingInfo({
                              ...billingInfo,
                              phone: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 rounded-2xl bg-primary text-lg font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
                      >
                        {loading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          "Salvar e Continuar"
                        )}
                      </Button>
                    </form>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="checkout-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className="p-8 rounded-[2.5rem] border-primary shadow-2xl bg-card relative overflow-hidden ring-4 ring-primary/5">
                  <div className="absolute top-0 right-0 bg-primary text-white px-6 py-2 rounded-bl-3xl text-xs font-black tracking-widest flex items-center gap-2">
                    <Zap className="w-3 h-3 fill-white" /> POPULAR
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-2">
                      <h3 className="text-3xl font-black">Assinatura Mensal</h3>
                      <p className="text-muted-foreground">
                        O investimento que se paga no primeiro serviço.
                      </p>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-muted-foreground">
                        R$
                      </span>
                      <span className="text-6xl font-black tracking-tighter text-primary">
                        9,99
                      </span>
                      <span className="text-muted-foreground font-medium text-lg ml-1">
                        /mês
                      </span>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <Ticket className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase">
                            Tem um cupom?
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="CÓDIGO"
                            className="h-12 rounded-xl uppercase font-mono tracking-widest"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground ml-1">
                          Não tem um cupom?{" "}
                          <button
                            onClick={() => setIsRequestingCoupon(true)}
                            className="text-primary font-bold hover:underline"
                          >
                            Solicite um desconto aqui
                          </button>
                        </p>
                      </div>

                      {subscriptionStatus === "PENDING" ||
                      subscriptionStatus === "ACTIVE" ? (
                        <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-700 text-center space-y-2">
                          <Check className="w-6 h-6 mx-auto" />
                          <p className="font-bold">Assinatura já solicitada!</p>
                          <p className="text-xs">
                            Verifique seu e-mail ou o portal do Asaas para o
                            pagamento.
                          </p>
                        </div>
                      ) : (
                        <Button
                          onClick={handleSubscribe}
                          disabled={loading}
                          className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-xl font-black shadow-2xl shadow-primary/30 group overflow-hidden relative"
                        >
                          {loading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                          ) : (
                            <span className="flex items-center gap-2">
                              ASSINAR AGORA
                              <CreditCard className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                          )}
                        </Button>
                      )}

                      <div className="flex flex-col items-center gap-3 text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                        <div className="flex items-center gap-4 grayscale opacity-50">
                          <span>PIX</span>
                          <span>BOLETO</span>
                          <span>CARTÃO</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          PAGAMENTO SEGURO VIA ASAAS
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Coupon Request Modal */}
      <AnimatePresence>
        {isRequestingCoupon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setIsRequestingCoupon(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md"
            >
              <Card className="p-6 border-primary shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold">Solicitar Desconto</h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsRequestingCoupon(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <form
                  action={async (formData) => {
                    setLoading(true);
                    const res = await requestCoupon(formData);
                    if (res.success) {
                      toast.success(res.message);
                      setIsRequestingCoupon(false);
                    } else {
                      toast.error(res.error);
                    }
                    setLoading(false);
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Código que você gostaria
                    </label>
                    <Input
                      name="code"
                      placeholder="EX: MEUPRIMEIROMES"
                      className="uppercase font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Por que você merece esse desconto?
                    </label>
                    <textarea
                      name="reason"
                      className="w-full min-h-[100px] rounded-xl bg-muted/50 border border-border/50 p-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                      placeholder="Conte-nos um pouco sobre você e seus objetivos na plataforma..."
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl font-bold"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Enviar Solicitação
                  </Button>
                </form>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
