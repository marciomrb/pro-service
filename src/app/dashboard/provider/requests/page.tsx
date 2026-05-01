import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, MapPin } from "lucide-react";
import MakeOfferForm from "@/components/provider/make-offer-form";
import {
  markInProgress as _markInProgress,
  markCompletedByProvider as _markCompletedByProvider,
} from "@/actions/service-request-actions";

async function doMarkInProgress(requestId: string): Promise<void> {
  "use server";
  await _markInProgress(requestId);
}
async function doMarkCompleted(requestId: string): Promise<void> {
  "use server";
  await _markCompletedByProvider(requestId);
}

const urgencyConfig: Record<string, { label: string; color: string }> = {
  normal: { label: "Normal", color: "bg-muted text-muted-foreground" },
  medium: {
    label: "Urgência Média",
    color:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
  },
  high: {
    label: "🔥 Urgente",
    color: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
  },
};

export default async function ProviderRequestsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Buscar profile do provider para saber a categoria, status e localização
  const { data: providerProfile } = await supabase
    .from("provider_profiles")
    .select("category_id, subscription_status")
    .eq("id", user.id)
    .single();

  // Buscar localização do provider para decidir se o fallback genérico deve ser usado
  const { data: providerLocation } = await supabase
    .from("profiles")
    .select("latitude, longitude, location")
    .eq("id", user.id)
    .single();

  const hasLocation = !!(
    providerLocation?.location ||
    (providerLocation?.latitude && providerLocation?.longitude)
  );

  // Buscar requests abertos próximos usando a função RPC geoespacial
  const { data: nearbyRequestsRaw } = await supabase.rpc(
    "find_nearby_requests_for_provider",
    {
      p_id: user.id,
      radius_meters: 30000, // 30km
      category_id_filter: providerProfile?.category_id || null,
    },
  );

  // Normalize nearby requests to match the nested structure used by fallback queries
  const nearbyRequests =
    nearbyRequestsRaw?.map((req: any) => ({
      ...req,
      categories:
        req.categories ||
        (req.category_name
          ? { name: req.category_name, icon: req.category_icon }
          : null),
      profiles:
        req.profiles ||
        (req.client_name
          ? { full_name: req.client_name, avatar_url: req.client_avatar_url }
          : null),
    })) || [];

  // Buscar ofertas para os requests próximos (RPC não retorna joins)
  if (nearbyRequests.length > 0) {
    const { data: offers } = await supabase
      .from("service_request_offers")
      .select("id, service_request_id, provider_id, status")
      .in(
        "service_request_id",
        nearbyRequests.map((r: any) => r.id),
      );

    nearbyRequests.forEach((req: any) => {
      req.service_request_offers =
        offers?.filter((o: any) => o.service_request_id === req.id) || [];
    });
  }

  let openRequests = nearbyRequests;
  let noLocationConfigured = false;

  // FALLBACK: Só usa fallback genérico se o provider NÃO tem localização configurada.
  // Se tem localização mas não encontrou nada perto, mostra vazio (comportamento correto).
  if (openRequests.length === 0 && !hasLocation) {
    noLocationConfigured = true;
    // Provider sem localização → não conseguimos filtrar por distância,
    // então mostramos requests da mesma categoria ou os mais recentes
    if (providerProfile?.category_id) {
      const { data: categoryRequests } = await supabase
        .from("service_requests")
        .select(
          `
          *,
          categories!category_id(name, icon),
          profiles:client_id(full_name, avatar_url),
          service_request_offers!service_request_id(id, provider_id, status)
        `,
        )
        .eq("status", "open")
        .eq("category_id", providerProfile.category_id)
        .order("created_at", { ascending: false })
        .limit(20);

      openRequests = categoryRequests || [];
    } else {
      const { data: allRequests } = await supabase
        .from("service_requests")
        .select(
          `
          *,
          categories!category_id(name, icon),
          profiles:client_id(full_name, avatar_url),
          service_request_offers!service_request_id(id, provider_id, status)
        `,
        )
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(20);

      openRequests = allRequests || [];
    }
  }

  // Buscar requests onde este provider foi aceito (matched/in_progress/pending_completion)
  const { data: myActiveRequests } = await supabase
    .from("service_requests")
    .select(
      `
      *,
      categories!category_id(name, icon),
      profiles:client_id(full_name, avatar_url),
      service_request_offers!service_request_id!inner(id, budget_offer, status, provider_id)
    `,
    )
    .in("status", ["matched", "in_progress", "pending_completion"])
    .eq("service_request_offers.provider_id", user.id)
    .eq("service_request_offers.status", "accepted");

  const isSubscribed = providerProfile?.subscription_status === "active";

  const isNearby = nearbyRequests.length > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Solicitações de Serviço
          </h1>
          {isNearby && (
            <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md animate-pulse">
              Explorar Próximos
            </span>
          )}
        </div>
        <p className="text-muted-foreground">
          {isNearby 
            ? "Encontramos oportunidades exclusivas perto de você."
            : hasLocation
              ? "Nenhuma solicitação próxima encontrada no momento."
              : noLocationConfigured
                ? "Configure sua localização para ver solicitações próximas."
                : "Explore todas as solicitações abertas na plataforma."}
        </p>
      </div>

      {!isSubscribed && (
        <Card className="p-5 rounded-2xl bg-primary/5 border-primary/20 border-dashed flex items-center gap-4">
          <div className="text-2xl">🔒</div>
          <div>
            <p className="font-semibold">
              Recurso exclusivo para assinantes Pro
            </p>
            <p className="text-sm text-muted-foreground">
              Assine o plano Pro para ver e responder solicitações de clientes
              na sua área.
            </p>
          </div>
        </Card>
      )}

      {noLocationConfigured && (
        <Card className="p-5 rounded-2xl bg-yellow-50 dark:bg-yellow-900/10 border-yellow-300 dark:border-yellow-700 border-dashed flex items-center gap-4">
          <div className="text-2xl">📍</div>
          <div>
            <p className="font-semibold text-yellow-800 dark:text-yellow-300">
              Localização não configurada
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              Configure sua localização em{" "}
              <a href="/dashboard/settings" className="underline font-bold hover:text-yellow-900 dark:hover:text-yellow-200">
                Configurações
              </a>{" "}
              para ver apenas solicitações próximas de você.
            </p>
          </div>
        </Card>
      )}

      {/* Active Jobs */}
      {myActiveRequests && myActiveRequests.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Loader2 className="w-5 h-5 text-primary animate-spin" /> Meus
            Serviços Ativos
          </h2>
          {myActiveRequests.map((req: any) => {
            const myOffer = req.service_request_offers?.[0];
            const statusMap: Record<string, { label: string; color: string }> =
              {
                matched: {
                  label: "Aguardando início",
                  color: "bg-purple-100 text-purple-700",
                },
                in_progress: {
                  label: "Em andamento",
                  color: "bg-yellow-100 text-yellow-700",
                },
                pending_completion: {
                  label: "Aguardando confirmação do cliente",
                  color: "bg-orange-100 text-orange-700",
                },
              };
            const s = statusMap[req.status];
            return (
              <Card
                key={req.id}
                className="p-5 rounded-2xl border-primary/20 bg-primary/5 space-y-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-muted shrink-0">
                    <img
                      src={
                        req.profiles?.avatar_url ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(req.profiles?.full_name || "C")}&background=0E5D91&color=fff`
                      }
                      alt="Cliente"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s?.color}`}
                      >
                        {s?.label}
                      </span>
                    </div>
                    <h3 className="font-bold mt-1">{req.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {req.description}
                    </p>
                    <p className="text-primary font-bold mt-2">
                      R$ {myOffer?.budget_offer}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {req.status === "matched" && (
                    <form action={doMarkInProgress.bind(null, req.id)}>
                      <Button
                        type="submit"
                        size="sm"
                        className="rounded-xl gap-1.5"
                      >
                        <Loader2 className="w-3.5 h-3.5" /> Iniciar Serviço
                      </Button>
                    </form>
                  )}
                  {req.status === "in_progress" && (
                    <form action={doMarkCompleted.bind(null, req.id)}>
                      <Button
                        type="submit"
                        size="sm"
                        className="rounded-xl gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Marcar como
                        Concluído
                      </Button>
                    </form>
                  )}
                  {req.status === "pending_completion" && (
                    <span className="text-sm text-muted-foreground italic">
                      Aguardando confirmação do cliente...
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Open Requests */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold">Solicitações Abertas</h2>

        {!openRequests || openRequests.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground border-dashed border-2 bg-muted/5">
            <MapPin className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="font-medium">
              {hasLocation
                ? "Nenhuma solicitação próxima no momento"
                : "Nenhuma solicitação aberta no momento"}
            </p>
            <p className="text-sm mt-1">
              {hasLocation
                ? "Quando clientes dentro de 30km criarem solicitações, elas aparecerão aqui."
                : "Configure sua localização nas configurações para ver solicitações próximas."}
            </p>
          </Card>
        ) : (
          openRequests.map((req: any) => {
            const urg = urgencyConfig[req.urgency] || urgencyConfig.normal;
            const myOffer = req.service_request_offers?.find(
              (o: any) => o.provider_id === user.id,
            );
            const totalOffers = req.service_request_offers?.length || 0;

            return (
              <Card
                key={req.id}
                className={`p-5 rounded-2xl transition-all ${myOffer ? "border-green-500/30 bg-green-500/5" : "hover:shadow-md"}`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-muted shrink-0">
                    <img
                      src={
                        req.profiles?.avatar_url ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(req.profiles?.full_name || "C")}&background=0E5D91&color=fff`
                      }
                      alt="Cliente"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <h3 className="font-bold text-foreground">
                          {req.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {req.profiles?.full_name} •{" "}
                          {new Date(req.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {req.budget ? (
                          <p className="text-lg font-extrabold text-primary flex items-center gap-1">
                            R$ {req.budget}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Orçamento a combinar
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-foreground/80 mt-2 line-clamp-2">
                      {req.description}
                    </p>

                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {req.categories && (
                        <span className="text-xs bg-muted px-2.5 py-1 rounded-full">
                          {req.categories.icon} {req.categories.name}
                        </span>
                      )}
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${urg.color}`}
                      >
                        {urg.label}
                      </span>
                      {req.dist_meters !== undefined &&
                        req.dist_meters !== null && (
                          <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 px-2.5 py-1 rounded-full flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{" "}
                            {(req.dist_meters / 1000).toFixed(1)} km
                          </span>
                        )}
                      {req.address && (
                        <span className="text-xs bg-muted px-2.5 py-1 rounded-full flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {req.address}
                        </span>
                      )}
                      {totalOffers > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {totalOffers} proposta{totalOffers > 1 ? "s" : ""}{" "}
                          enviada{totalOffers > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    {isSubscribed ? (
                      myOffer ? (
                        <div className="mt-3">
                          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                            ✅ Proposta enviada
                          </span>
                        </div>
                      ) : (
                        <div className="mt-3">
                          <MakeOfferForm
                            requestId={req.id}
                            suggestedBudget={req.budget}
                          />
                        </div>
                      )
                    ) : (
                      <p className="text-xs text-muted-foreground mt-3 italic">
                        Assine o Pro para fazer propostas
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
