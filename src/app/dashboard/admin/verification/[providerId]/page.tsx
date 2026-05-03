import { getProviderDocumentsForAdmin } from "@/actions/admin-verification-actions";
import { createClient } from "@/lib/supabase/server";
import { VerificationReview } from "@/components/admin/verification-review";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft, User, Mail, Calendar, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";

interface PageProps {
  params: Promise<{ providerId: string }>;
}

export default async function AdminProviderVerificationPage({
  params,
}: PageProps) {
  const { providerId } = await params;
  const supabase = await createClient();

  // Fetch provider profile info
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      `
      full_name,
      email,
      created_at,
      provider_profiles (
        city,
        state,
        is_verified
      )
    `,
    )
    .eq("id", providerId)
    .single();

  const documents = await getProviderDocumentsForAdmin(providerId);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" className="rounded-full w-10 h-10 p-0">
          <Link href="/dashboard/admin/verification">
            <ChevronLeft className="w-6 h-6" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Análise de Documentos
          </h1>
          <p className="text-muted-foreground mt-1">
            Verificando credenciais de {profile?.full_name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="p-6 rounded-3xl border-border/50 shadow-sm space-y-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <User className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{profile?.full_name}</h3>
                <div
                  className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                    profile?.provider_profiles?.[0]?.is_verified
                      ? "bg-green-500/10 text-green-600 border-green-500/20"
                      : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  }`}
                >
                  {profile?.provider_profiles?.[0]?.is_verified
                    ? "CONTA VERIFICADA"
                    : "AGUARDANDO VERIFICAÇÃO"}
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t border-border/50 pt-6">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{profile?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>
                  {profile?.provider_profiles?.[0]?.city},{" "}
                  {profile?.provider_profiles?.[0]?.state}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>
                  Membro desde{" "}
                  {new Date(profile?.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-3xl border-border/50 bg-primary/5 border-primary/10 shadow-sm">
            <h4 className="font-bold mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Critérios de Aprovação
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Para que o selo de verificado seja liberado automaticamente, o
              prestador deve ter aprovados:
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-border" />
                RG ou CNH (Identidade)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-border" />
                Comprovante de Residência
              </li>
            </ul>
          </Card>
        </div>

        {/* Documents List */}
        <div className="lg:col-span-2">
          <VerificationReview documents={documents} providerId={providerId} />
        </div>
      </div>
    </div>
  );
}
