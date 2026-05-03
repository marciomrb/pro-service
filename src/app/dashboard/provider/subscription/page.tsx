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
  History,
  Calendar,
  ExternalLink,
  ArrowRight,
  TrendingUp,
  FileText,
  Trash2,
} from "lucide-react";
import {
  createProviderSubscription,
  requestCoupon,
  getSubscriptionDetails,
  getSubscriptionHistory,
  cancelSubscriptionAction,
} from "@/actions/subscription-actions";
import { updateBillingInfo } from "@/actions/profile-actions";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [billingInfo, setBillingInfo] = useState({ cpf_cnpj: "", phone: "" });
  const [hasBillingInfo, setHasBillingInfo] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(
    null,
  );
  const [isRequestingCoupon, setIsRequestingCoupon] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [isCancelling, setIsCancelling] = useState(false);

  const supabase = createClient();

  const loadData = async () => {
    setProfileLoading(true);
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

          // Se tiver assinatura, buscar detalhes extras do Asaas
          if (sub.asaas_subscription_id) {
            const [detailsRes, historyRes] = await Promise.all([
              getSubscriptionDetails(),
              getSubscriptionHistory(),
            ]);

            if (detailsRes.success) setSubscriptionDetails(detailsRes.details);
            if (historyRes.success)
              setPaymentHistory(historyRes.payments || []);
          }
        }
      }
    }
    setProfileLoading(false);
  };

  useEffect(() => {
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
      loadData(); // Recarregar para mostrar status pending e link
    }
    setLoading(false);
  };

  const handleCancelSubscription = async () => {
    if (
      !confirm(
        "Tem certeza que deseja cancelar sua assinatura? Você perderá acesso aos recursos Pro ao final do período atual.",
      )
    )
      return;

    setLoading(true);
    const result = await cancelSubscriptionAction();
    if (result.success) {
      toast.success(result.message);
      loadData();
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse font-medium">
          Carregando seus dados...
        </p>
      </div>
    );
  }

  const isPro = subscriptionStatus === "ACTIVE";
  const isPending = subscriptionStatus === "PENDING";
  const isOverdue = subscriptionStatus === "OVERDUE";

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 space-y-10">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-primary/10 text-primary border-primary/20 rounded-full px-3"
            >
              {isPro ? "Membro Premium" : "Plano Free"}
            </Badge>
            {isPending && (
              <Badge
                variant="outline"
                className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 rounded-full px-3"
              >
                Pagamento Pendente
              </Badge>
            )}
          </div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
            Assinatura Pro
            {isPro && (
              <Sparkles className="w-8 h-8 text-yellow-500 fill-yellow-500" />
            )}
          </h1>
          <p className="text-muted-foreground text-lg">
            {isPro
              ? "Você está aproveitando todos os recursos exclusivos da plataforma."
              : "Evolua seu perfil e conquiste mais clientes com o Plano Pro."}
          </p>
        </div>

        {isPro && (
          <Button
            variant="outline"
            className="text-destructive hover:bg-destructive/10 border-destructive/20 rounded-xl"
            onClick={handleCancelSubscription}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            Cancelar Assinatura
          </Button>
        )}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Management / Benefits */}
        <div className="lg:col-span-7 space-y-8">
          {/* Status Card (Active/Pending) */}
          {(isPro || isPending || isOverdue) && (
            <Card className="overflow-hidden border-primary/20 shadow-xl bg-card/50 backdrop-blur-sm">
              <div
                className={`h-2 w-full ${isPro ? "bg-green-500" : isOverdue ? "bg-destructive" : "bg-yellow-500"}`}
              />
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      Status da Assinatura
                    </span>
                    <h3
                      className={`text-2xl font-black ${isPro ? "text-green-600" : isOverdue ? "text-destructive" : "text-yellow-600"}`}
                    >
                      {isPro
                        ? "Ativa e Regular"
                        : isOverdue
                          ? "Atrasada"
                          : "Aguardando Pagamento"}
                    </h3>
                  </div>
                  <div className="p-3 bg-muted rounded-2xl">
                    <CreditCard className="w-6 h-6 text-primary" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-muted/50 border border-border/50">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                      Próximo Vencimento
                    </span>
                    <span className="font-bold flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-primary" />
                      {subscriptionDetails?.nextDueDate
                        ? format(
                            new Date(subscriptionDetails.nextDueDate),
                            "dd 'de' MMMM",
                            { locale: ptBR },
                          )
                        : "---"}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-muted/50 border border-border/50">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                      Valor Mensal
                    </span>
                    <span className="font-bold text-primary">
                      R$ {subscriptionDetails?.value || "9,99"}
                    </span>
                  </div>
                </div>

                {isPending && (
                  <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <p className="text-sm text-yellow-800 font-medium">
                        Sua assinatura foi gerada. Verifique seu e-mail para
                        acessar o link de pagamento ou utilize o portal do Asaas
                        abaixo.
                      </p>
                      {paymentHistory.find((p) => p.status === "PENDING") ? (
                        <Button
                          size="sm"
                          className="bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg h-9"
                        >
                          <a
                            href={
                              paymentHistory.find((p) => p.status === "PENDING")
                                ?.invoiceUrl
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Acessar Fatura{" "}
                            <ExternalLink className="w-3 h-3 ml-2" />
                          </a>
                        </Button>
                      ) : (
                        <p className="text-[10px] text-yellow-700 italic">
                          Processando fatura no Asaas...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Benefits Grid (Always show or show small if Pro) */}
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
                title: "Estatísticas de Visitas",
                desc: "Saiba quem viu seu perfil.",
                icon: <TrendingUp className="w-5 h-5 text-green-500" />,
              },
            ].map((benefit, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all hover:shadow-md group"
              >
                <div className="mb-3 p-2 rounded-xl bg-muted w-fit group-hover:bg-primary/10 transition-colors">
                  {benefit.icon}
                </div>
                <h3 className="font-bold text-foreground">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {benefit.desc}
                </p>
              </div>
            ))}
          </div>

          {/* History Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Histórico de Pagamentos
            </h3>
            {paymentHistory.length > 0 ? (
              <Card className="divide-y divide-border overflow-hidden">
                {paymentHistory.map((payment, i) => (
                  <div
                    key={i}
                    className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-2 rounded-lg ${payment.status === "RECEIVED" || payment.status === "CONFIRMED" ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}`}
                      >
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">
                          Mensalidade ProService
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(
                            new Date(payment.dueDate),
                            "dd 'de' MMM 'de' yyyy",
                            { locale: ptBR },
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm font-black text-foreground">
                        R$ {payment.value.toFixed(2)}
                      </p>
                      <Badge
                        variant="outline"
                        className={`text-[10px] h-5 rounded-md ${
                          payment.status === "RECEIVED" ||
                          payment.status === "CONFIRMED"
                            ? "border-green-500/30 text-green-600 bg-green-500/5"
                            : "border-yellow-500/30 text-yellow-600 bg-yellow-500/5"
                        }`}
                      >
                        {payment.status === "RECEIVED" ||
                        payment.status === "CONFIRMED"
                          ? "Pago"
                          : "Pendente"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </Card>
            ) : (
              <div className="text-center p-10 border-2 border-dashed rounded-3xl space-y-2 opacity-60">
                <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                  <History className="w-6 h-6" />
                </div>
                <p className="font-medium">
                  Nenhum pagamento registrado ainda.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Checkout / Billing Info */}
        <div className="lg:col-span-5">
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
            ) : !isPro && !isPending ? (
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
                      <h3 className="text-3xl font-black">
                        Plano Profissional
                      </h3>
                      <p className="text-muted-foreground italic">
                        "O investimento que se paga no primeiro serviço."
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
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </span>
                        )}
                      </Button>

                      <div className="flex flex-col items-center gap-3 text-[10px] text-muted-foreground uppercase font-bold tracking-widest border-t border-border/50 pt-6">
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
            ) : (
              <motion.div
                key="active-info"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className="p-8 rounded-[2.5rem] border-border shadow-lg bg-card space-y-6">
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                    <div className="p-3 bg-primary rounded-xl">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold">Membro Proativo</h4>
                      <p className="text-xs text-muted-foreground">
                        Sua assinatura está garantindo visibilidade total.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                      Configurações
                    </h4>
                    <Button
                      variant="outline"
                      className="w-full justify-start h-12 rounded-xl text-sm"
                      onClick={() => setHasBillingInfo(false)}
                    >
                      <CreditCard className="w-4 h-4 mr-3 text-primary" />
                      Alterar Dados de Faturamento
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start h-12 rounded-xl text-sm"
                    >
                      <MessageSquare className="w-4 h-4 mr-3 text-primary" />
                      Suporte ao Assinante
                    </Button>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/30 text-xs text-muted-foreground leading-relaxed">
                    <p>
                      <strong>Atenção:</strong> O faturamento é realizado
                      mensalmente de forma automática. Para evitar interrupções
                      no selo de verificado, mantenha seu pagamento em dia.
                    </p>
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
              <Card className="p-6 border-primary shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />

                <div className="flex items-center justify-between mb-6 relative z-10">
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
                    className="rounded-full"
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
                  className="space-y-4 relative z-10"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium ml-1">
                      Código que você gostaria
                    </label>
                    <Input
                      name="code"
                      placeholder="EX: MEUPRIMEIROMES"
                      className="h-12 rounded-xl bg-muted/50 border-border/50 uppercase font-mono tracking-widest"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium ml-1">
                      Por que você merece esse desconto?
                    </label>
                    <textarea
                      name="reason"
                      className="w-full min-h-[120px] rounded-2xl bg-muted/50 border border-border/50 p-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                      placeholder="Conte-nos um pouco sobre sua trajetória..."
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 rounded-2xl font-bold shadow-xl shadow-primary/20"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Enviar Solicitação
                      </>
                    )}
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
