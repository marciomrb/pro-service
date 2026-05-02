import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MailCheck, ArrowLeft, Sparkles } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Confirme seu E-mail | ProService",
  description: "Enviamos um link de confirmação para o seu e-mail.",
};

export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-6 relative overflow-hidden">
      {/* Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[5%] -right-[5%] w-[30%] h-[50%] rounded-full bg-accent/10 blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-8 space-y-2">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <MailCheck className="w-10 h-10" />
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Verifique seu e-mail</h1>
          <p className="text-muted-foreground text-lg">
            Quase lá! Enviamos um link de confirmação para:
          </p>
          {email && (
            <div className="inline-block px-4 py-1.5 rounded-full bg-primary/5 text-primary font-bold text-sm border border-primary/10 mt-2">
              {email}
            </div>
          )}
        </div>

        <Card className="p-8 rounded-[2.5rem] shadow-2xl border-primary/10 bg-white/80 backdrop-blur-xl space-y-6 text-center">
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Para ativar sua conta, clique no link que enviamos. Se não encontrar, verifique a pasta de <strong>spam</strong> ou lixo eletrônico.
            </p>
          </div>

          <div className="pt-4 space-y-4">
            <Link href="/login">
              <Button className="w-full h-14 rounded-2xl bg-primary hover:bg-accent text-base font-bold shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-95">
                Ir para o Login
              </Button>
            </Link>
            
            <Link href="/" className="flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors py-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar para a página inicial
            </Link>
          </div>
        </Card>

        <div className="mt-12 flex justify-center opacity-30">
          <img src="/logo_full.webp" alt="ProService" className="h-6 w-auto" />
        </div>
      </div>
    </div>
  );
}
