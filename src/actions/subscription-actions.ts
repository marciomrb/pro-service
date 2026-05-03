"use server"

import { createClient } from "@/lib/supabase/server";
import { asaas } from "@/lib/asaas";
import { revalidatePath } from "next/cache";

const SUBSCRIPTION_VALUE = 9.99; // Valor da mensalidade padrão

/**
 * Cria uma assinatura para o prestador no Asaas.
 * Gerencia a criação do cliente, aplicação de cupom e registro no banco de dados.
 */
export async function createProviderSubscription(formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Usuário não autenticado." };
  }

  const couponCode = formData.get("couponCode")?.toString().trim().toUpperCase();
  
  try {
    // 1. Buscar dados do perfil e do prestador
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(`
        full_name,
        email,
        role,
        provider_profiles (
          cpf_cnpj,
          phone
        )
      `)
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return { error: "Perfil não encontrado." };
    }

    if (profile.role !== "provider") {
      return { error: "Apenas prestadores podem realizar assinaturas." };
    }

    // Acessando provider_profiles com segurança
    const providerData = Array.isArray(profile.provider_profiles) 
      ? profile.provider_profiles[0] 
      : profile.provider_profiles;
    
    if (!providerData?.cpf_cnpj) {
      return { error: "Por favor, preencha seu CPF ou CNPJ no seu perfil antes de assinar." };
    }

    // 2. Verificar se já existe um registro de cliente/assinatura
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("asaas_customer_id")
      .eq("provider_id", user.id)
      .maybeSingle();

    let asaasCustomerId = existingSub?.asaas_customer_id;

    // 3. Criar Cliente no Asaas se não existir
    if (!asaasCustomerId) {
      const asaasCustomer = await asaas.createCustomer({
        name: profile.full_name,
        email: profile.email || user.email!,
        cpfCnpj: providerData.cpf_cnpj.replace(/\D/g, ''), // Remove tudo que não for número
        phone: providerData.phone || undefined,
        externalReference: user.id
      });
      asaasCustomerId = asaasCustomer.id;
    }

    // 4. Validar e Aplicar Cupom de Desconto
    let discount = undefined;
    let appliedCouponId = null;

    if (couponCode) {
      const { data: isValid, error: rpcError } = await supabase.rpc('use_coupon', { 
        coupon_code: couponCode,
        provider_uuid: user.id 
      });

      if (rpcError) {
        return { error: "Cupom inválido: " + rpcError.message };
      }

      if (isValid) {
        const { data: coupon } = await supabase
          .from("coupons")
          .select("id, discount_percentage")
          .eq("code", couponCode)
          .single();

        if (coupon) {
          appliedCouponId = coupon.id;
          discount = {
            value: coupon.discount_percentage,
            dueDateLimitDays: 0,
            type: "PERCENTAGE" as const
          };
        }
      }
    }

    // 5. Criar Assinatura no Asaas
    // Data de vencimento em 3 dias para dar tempo do prestador pagar
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 3);

    const asaasSub = await asaas.createSubscription({
      customer: asaasCustomerId,
      billingType: "UNDEFINED", // Permite ao usuário escolher o método de pagamento no checkout do Asaas
      value: SUBSCRIPTION_VALUE,
      nextDueDate: nextDueDate.toISOString().split('T')[0],
      cycle: "MONTHLY",
      description: "Assinatura Mensal ProService - Prestador",
      externalReference: user.id,
      discount: discount
    });

    // 6. Atualizar banco de dados local com os IDs do Asaas
    const { error: upsertError } = await supabase
      .from("subscriptions")
      .upsert({
        provider_id: user.id,
        asaas_customer_id: asaasCustomerId,
        asaas_subscription_id: asaasSub.id,
        status: "PENDING",
        amount: SUBSCRIPTION_VALUE,
        applied_coupon_id: appliedCouponId,
        updated_at: new Date().toISOString()
      }, { onConflict: 'provider_id' });

    if (upsertError) {
      console.error("Erro ao salvar assinatura no DB:", upsertError);
      throw new Error("Erro ao registrar assinatura localmente.");
    }

    revalidatePath("/dashboard/billing");
    
    return { 
      success: true, 
      asaasSubscriptionId: asaasSub.id,
      message: "Assinatura gerada com sucesso! Você receberá as instruções de pagamento." 
    };

  } catch (error: any) {
    console.error("Erro no processo de assinatura Asaas:", error);
    return { error: error.message || "Erro inesperado ao processar assinatura." };
  }
}

/**
 * Permite que um prestador solicite um cupom de desconto.
 */
export async function requestCoupon(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Não autenticado" };

  const requestedCode = formData.get("code")?.toString().trim().toUpperCase();
  const reason = formData.get("reason")?.toString();

  if (!requestedCode) return { error: "O código desejado é obrigatório." };

  const { error } = await supabase
    .from("coupon_requests")
    .insert({
      provider_id: user.id,
      requested_code: requestedCode,
      reason: reason,
      status: 'PENDING'
    });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/provider/subscription");
  return { success: true, message: "Solicitação enviada com sucesso! Aguarde a análise do administrador." };
}

/**
 * Busca detalhes da assinatura no Asaas.
 */
export async function getSubscriptionDetails() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("provider_id", user.id)
    .single();

  if (!sub || !sub.asaas_subscription_id) return { error: "Assinatura não encontrada" };

  try {
    const details = await asaas.getSubscription(sub.asaas_subscription_id);
    return { success: true, details };
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Busca o histórico de pagamentos da assinatura.
 */
export async function getSubscriptionHistory() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("asaas_subscription_id")
    .eq("provider_id", user.id)
    .single();

  if (!sub || !sub.asaas_subscription_id) return { error: "Sem histórico" };

  try {
    const history = await asaas.listSubscriptionPayments(sub.asaas_subscription_id);
    return { success: true, payments: history.data };
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Cancela a assinatura do prestador.
 */
export async function cancelSubscriptionAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("asaas_subscription_id")
    .eq("provider_id", user.id)
    .single();

  if (!sub || !sub.asaas_subscription_id) return { error: "Assinatura não encontrada" };

  try {
    await asaas.cancelSubscription(sub.asaas_subscription_id);
    
    // Atualizar localmente
    await supabase
      .from("subscriptions")
      .update({ status: 'CANCELLED' })
      .eq("provider_id", user.id);

    await supabase
      .from("provider_profiles")
      .update({ subscription_status: 'inactive' })
      .eq("id", user.id);

    revalidatePath("/dashboard/provider/subscription");
    return { success: true, message: "Assinatura cancelada com sucesso." };
  } catch (error: any) {
    return { error: error.message };
  }
}

