import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Trash2, ShieldAlert } from "lucide-react";
import Image from "next/image";

export default async function AdminServicesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  // Fetch providers/services
  const { data: providers } = await supabase
    .from("provider_profiles")
    .select(`
      id,
      profession_title,
      hourly_rate,
      city,
      is_verified,
      profiles (
        full_name,
        avatar_url
      ),
      categories (
        name
      )
    `);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Serviços e Prestadores</h1>
        <p className="text-muted-foreground mt-1">
          Visualize e gerencie os serviços oferecidos pelos profissionais cadastrados.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providers?.map((provider: any) => (
          <Card key={provider.id} className="p-6 rounded-3xl border-border/50 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/10 relative">
                {provider.profiles?.avatar_url ? (
                  <img
                    src={provider.profiles.avatar_url}
                    alt={provider.profiles.full_name}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-primary">
                    {provider.profiles?.full_name?.charAt(0) || "U"}
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">{provider.profession_title || "Sem Título"}</h3>
                <p className="text-sm text-muted-foreground">{provider.profiles?.full_name}</p>
              </div>
            </div>

            <div className="bg-muted/30 p-3 rounded-xl space-y-1">
              <p className="text-sm"><span className="font-semibold">Categoria:</span> {provider.categories?.name || "Nenhuma"}</p>
              <p className="text-sm"><span className="font-semibold">Local:</span> {provider.city || "Não informado"}</p>
              <p className="text-sm"><span className="font-semibold">Valor/hora:</span> R$ {provider.hourly_rate || "0"}/h</p>
            </div>

            <div className="mt-auto pt-4 flex gap-2 border-t border-border/50">
              <button className="flex-1 px-4 py-2 bg-primary/10 text-primary font-medium rounded-xl text-sm hover:bg-primary/20 transition-colors">
                Detalhes
              </button>
              <button className="p-2 text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-xl transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </Card>
        ))}

        {(!providers || providers.length === 0) && (
          <div className="col-span-full py-12 flex flex-col items-center text-center text-muted-foreground bg-muted/20 rounded-3xl">
            <ShieldAlert className="w-12 h-12 mb-4 opacity-20" />
            <p>Nenhum serviço/prestador cadastrado no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
}
