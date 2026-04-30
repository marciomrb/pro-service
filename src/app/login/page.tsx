import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { login } from "@/actions/auth-actions";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entrar | ProService",
  other: {
    "disable-extension-feature": "read-dom",
  },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-muted/20">
      {/* Visual side */}
      <div className="hidden md:flex flex-1 bg-gradient-to-br from-primary to-accent text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-white/10 blur-[100px]" />
          <div className="absolute bottom-[10%] -right-[10%] w-[40%] h-[60%] rounded-full bg-accent/30 blur-[100px]" />
        </div>
        
        <div className="relative z-10 flex items-center">
          <img src="/logo_full.webp" alt="ProService" className="h-10 w-auto brightness-0 invert" />
        </div>
        
        <div className="relative z-10 max-w-lg space-y-6">
          <Sparkles className="w-12 h-12 text-white/80" />
          <h1 className="text-4xl font-extrabold leading-tight">Junte-se à rede dos melhores profissionais e clientes.</h1>
          <p className="text-white/80 text-lg">Conecte-se, contrate e realize serviços de forma rápida e segura.</p>
        </div>
        
        <div className="relative z-10 text-sm text-white/60">
          © {new Date().getFullYear()} ProService Inc. Todos os direitos reservados.
        </div>
      </div>

      {/* Form side */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center md:text-left space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Bem-vindo de volta</h2>
            <p className="text-muted-foreground">Insira seus dados para acessar sua conta</p>
          </div>

          <Card className="p-6 md:p-8 rounded-3xl shadow-xl border-primary/10">
            {message && (
              <div className="mb-4 p-4 text-sm text-destructive bg-destructive/10 rounded-xl">
                {message}
              </div>
            )}
            <form action={login} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">
                  E-mail
                </label>
                <Input id="email" name="email" type="email" placeholder="nome@exemplo.com" required className="h-12 rounded-xl focus-visible:ring-primary" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
                    Senha
                  </label>
                  <Link href="/forgot-password" className="text-sm font-medium text-primary hover:text-accent transition-colors">
                    Esqueceu a senha?
                  </Link>
                </div>
                <Input id="password" name="password" type="password" required className="h-12 rounded-xl focus-visible:ring-primary" />
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl bg-primary hover:bg-accent text-base font-bold shadow-md transition-colors mt-6">
                Entrar
              </Button>
            </form>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Ou continue com</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-12 rounded-xl border-muted-foreground/20 hover:bg-muted">
                Google
              </Button>
              <Button variant="outline" className="h-12 rounded-xl border-muted-foreground/20 hover:bg-muted">
                Apple
              </Button>
            </div>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            Não tem uma conta?{" "}
            <Link href="/register" className="font-semibold text-primary hover:text-accent transition-colors">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
