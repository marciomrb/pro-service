import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event, payment, subscription } = body;

    // Verificar token de segurança (opcional, mas recomendado)
    const webhookToken = req.headers.get("asaas-access-token");
    if (process.env.ASAAS_WEBHOOK_TOKEN && webhookToken !== process.env.ASAAS_WEBHOOK_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`[Asaas Webhook] Evento recebido: ${event}`, body);

    const supabase = await createAdminClient();

    // Identificar o prestador pelo externalReference (que deve ser o user_id)
    const providerId = payment?.externalReference || subscription?.externalReference;

    if (!providerId) {
      console.warn("[Asaas Webhook] externalReference não encontrado no payload.");
      return NextResponse.json({ received: true });
    }

    switch (event) {
      case "PAYMENT_CONFIRMED":
      case "PAYMENT_RECEIVED":
        // 1. Atualizar a tabela de assinaturas
        await supabase
          .from("subscriptions")
          .update({ 
            status: "ACTIVE",
            updated_at: new Date().toISOString()
          })
          .eq("provider_id", providerId);

        // 2. Ativar o perfil do prestador
        await supabase
          .from("provider_profiles")
          .update({ 
            subscription_status: "active",
            subscription_expires_at: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString() // Aproximadamente 1 mês + margem
          })
          .eq("id", providerId);

        console.log(`[Asaas Webhook] Pagamento confirmado para o prestador ${providerId}`);
        break;

      case "PAYMENT_OVERDUE":
        await supabase
          .from("subscriptions")
          .update({ status: "OVERDUE" })
          .eq("provider_id", providerId);

        await supabase
          .from("provider_profiles")
          .update({ subscription_status: "past_due" })
          .eq("id", providerId);
        
        console.log(`[Asaas Webhook] Pagamento atrasado para o prestador ${providerId}`);
        break;

      case "PAYMENT_DELETED":
      case "SUBSCRIPTION_DELETED":
        await supabase
          .from("subscriptions")
          .update({ status: "CANCELLED" })
          .eq("provider_id", providerId);

        await supabase
          .from("provider_profiles")
          .update({ subscription_status: "inactive" })
          .eq("id", providerId);

        console.log(`[Asaas Webhook] Assinatura cancelada para o prestador ${providerId}`);
        break;

      default:
        console.log(`[Asaas Webhook] Evento ignorado: ${event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[Asaas Webhook] Erro ao processar webhook:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
